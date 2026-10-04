"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import {
  materialAdaptations,
  materials,
  notifications,
} from "@/db/schema";
import { analisisMateri } from "@/lib/ai/analisis";
import { debug } from "@/lib/ai/debug";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { extractMaterialText, MAX_TEXT_LENGTH } from "@/lib/material-extract";
import type { AdaptedContent } from "@/db/types";
import type { ActionResult } from "./auth";

const adaptedContentSchema = z.custom<AdaptedContent>(
  (value) => Boolean(value) && typeof value === "object" && "sections" in (value as object),
  { message: "Konten adaptasi tidak valid." },
);

const fail = (message: string): ActionResult => ({ ok: false, message });

const materialInputSchema = z.object({
  title: z.string().min(3, "Judul materi minimal 3 karakter").max(160),
  subject: z.string().max(80).optional().or(z.literal("")),
  classId: z.string().uuid().optional().or(z.literal("")),
  targetStudentIds: z.array(z.string().uuid()).max(60).default([]),
});

/**
 * Simpan materi baru.
 *
 * Berkas TIDAK lagi dikirim sebagai bagian Server Action karena request
 * Server Action dibatasi 1 MB, sedangkan PRD memperbolehkan 20 MB. Alurnya:
 * peramban lebih dulu meminta tiket, mengunggah langsung ke Supabase
 * Storage, lalu memanggil aksi ini dengan `storagePath`. Server mengunduh
 * berkasnya kembali untuk ekstraksi teks.
 */
export async function createMaterialAction(input: {
  values: unknown;
  storagePath?: string | null;
  sourceFileName?: string | null;
  sourceType?: "pdf" | "docx" | "text" | null;
}): Promise<ActionResult & { materialId?: string }> {
  const parsed = materialInputSchema.safeParse(input.values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data materi belum lengkap.");
  }
  const values = parsed.data;
  const storagePath = input.storagePath ?? null;
  const sourceFileName = input.sourceFileName ?? null;

  const storagePathInput = z
    .string()
    .min(10, "Jalur berkas tidak valid.")
    .max(300)
    .optional()
    .nullable();

  const parsedPath = storagePathInput.safeParse(storagePath);
  if (!parsedPath.success) {
    return fail("Jalur berkas tidak valid.");
  }

  try {
    let sourceText = "";
    const sourceType: "pdf" | "docx" | "text" = input.sourceType ?? "text";
    let sourceUrl: string | null = null;
    const warnings: string[] = [];

    if (storagePath) {
      const unduhan = await unduhBahan(storagePath);
      if (!unduhan) {
        return fail(
          "Berkas tidak ditemukan di penyimpanan. Silakan unggah ulang materinya.",
        );
      }

      const ekstraksi = await ekstrakDariByte(unduhan.byte, unduhan.nama);
      sourceText = ekstraksi.text;
      if (ekstraksi.warning) warnings.push(ekstraksi.warning);
      sourceUrl = storagePath;
    } else {
      sourceText = String(
        (input.values as { text?: unknown } | undefined)?.text ?? "",
      ).slice(0, MAX_TEXT_LENGTH);
    }

    if (sourceText.trim().length < 20) {
      return fail(
        warnings[0] ??
          "Materi masih kosong. Tempelkan teks minimal 20 karakter atau unggah berkas yang berisi teks.",
      );
    }

    // PRD 6B: status awal draft, lalu pending_ai saat analisis berjalan,
    // lalu ai_ready. Kegagalan dikembalikan ke draft supaya tombol coba
    // lagi muncul.
    const context = await requireAuthContext();

    const materialId = await withRlsDb(context.claims, async (tx) => {
      const [row] = await tx
        .insert(materials)
        .values({
          teacherId: context.userId,
          classId: values.classId || null,
          title: values.title.trim(),
          subject: values.subject?.trim() || null,
          sourceType,
          sourceUrl,
          sourceFileName,
          sourceText,
          status: "draft",
        })
        .returning({ id: materials.id });

      await tx
        .update(materials)
        .set({ status: "pending_ai" })
        .where(eq(materials.id, row.id));

      return row.id;
    });

    revalidatePath(`/dashboard/materi/${materialId}`);

    let hasil;
    try {
      hasil = await analisisMateri({
        judul: values.title.trim(),
        mapel: values.subject?.trim() || "Umum",
        teks: sourceText,
        pakaiAi: true,
        allowFallback: false,
      });
    } catch (error) {
      await withRlsDb(context.claims, async (tx) => {
        await tx
          .update(materials)
          .set({ status: "draft" })
          .where(eq(materials.id, materialId));
      });
      revalidatePath(`/dashboard/materi/${materialId}`);
      
      const pesan = error instanceof Error ? error.message : "Analisis AI gagal. Silakan coba lagi.";
      return fail(pesan);
    }

    const ringkasan =
      `${hasil.analysis.structure.length} bagian teridentifikasi` +
      (hasil.analysis.visualSections.length > 0
        ? `, ${hasil.analysis.visualSections.length} bagian butuh ilustrasi`
        : "") +
      ".";

    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(materials)
        .set({
          aiAnalysis: hasil.analysis,
          status: "ai_ready",
        })
        .where(eq(materials.id, materialId));

      if (values.targetStudentIds.length > 0) {
        await tx
          .insert(materialAdaptations)
          .values(
            values.targetStudentIds.map((studentId) => ({
              materialId,
              studentId,
              status: "generating" as const,
              aiModel: "menunggu versi pertama",
            })),
          )
          .onConflictDoNothing();
      }

      await tx.insert(notifications).values({
        userId: context.userId,
        title: `Materi "${values.title.trim()}" selesai dianalisis`,
        body: `${ringkasan} ${hasil.catatan} ${
          values.targetStudentIds.length > 0
            ? `${values.targetStudentIds.length} siswa masuk antrean adaptasi.`
            : ""
        }`,
        type: "ai_done",
        link: `/dashboard/materi/${materialId}`,
      });
    });

    revalidatePath("/dashboard/materi");
    revalidatePath("/dashboard/materi/baru");
    revalidatePath("/dashboard", "layout");

    const warning = warnings.length > 0 ? ` ${warnings[0]}` : "";
    return {
      ok: true,
      materialId,
      message: `${values.title.trim()} tersimpan. Struktur materi: ${ringkasan}${warning}`,
    };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Materi gagal disimpan.",
    );
  }
}

/** Unduh satu berkas dari bucket materi memakai service role. */
async function unduhBahan(
  storagePath: string,
): Promise<{ byte: Uint8Array; nama: string } | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from("materials")
    .download(storagePath);

  if (error || !data) {
    debug.galat("berkas materi gagal diunduh", {
      jalur: storagePath,
      galat: error?.message ?? "tidak ada data",
    });
    return null;
  }

  const byte = new Uint8Array(await data.arrayBuffer());
  const nama = storagePath.split("/").pop() ?? storagePath;
  return { byte, nama };
}

/**
 * Ekstraksi teks dari byte yang diunduh.
 *
 * Fungsi ini membungkus ulang byte menjadi File supaya ekstraksi PDF, DOCX,
 * dan teks memakai satu jalur yang sama dengan versi peramban.
 */
async function ekstrakDariByte(
  byte: Uint8Array,
  nama: string,
): Promise<{ text: string; warning?: string }> {
  const ekstensi = nama.split(".").pop()?.toLowerCase();
  const contentType =
    ekstensi === "pdf"
      ? "application/pdf"
      : ekstensi === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "text/plain";

  const berkas = new File([byte as BlobPart], nama, { type: contentType });
  return extractMaterialText(berkas);
}

/**
 * Analisis ulang struktur materi.
 *
 * Dihapus karena versi yang dipakai tombol "Proses ulang" ada di
 * src/actions/ai.ts sebagai reanalyzeMaterialAction. Versi ini hanya
 * memakai analisis heuristik lokal dan tidak pernah dipanggil.
 */

/** Setujui satu versi adaptasi. */
export async function approveAdaptationAction(input: {
  adaptationId: string;
}): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const [row] = await tx
        .select({
          id: materialAdaptations.id,
          materialId: materialAdaptations.materialId,
        })
        .from(materialAdaptations)
        .where(eq(materialAdaptations.id, input.adaptationId))
        .limit(1);
      if (!row) throw new Error("Adaptasi tidak ditemukan.");

      await tx
        .update(materialAdaptations)
        .set({
          status: "approved",
          approvedAt: new Date().toISOString(),
          teacherEdits: sql`(coalesce(${materialAdaptations.teacherEdits}, '[]'::jsonb) || ${JSON.stringify([
            {
              at: new Date().toISOString(),
              note: "Guru menyetujui versi adaptasi ini.",
              sectionIndex: 0,
            },
          ])}::jsonb)`,
        })
        .where(eq(materialAdaptations.id, input.adaptationId));

      await tx.insert(notifications).values({
        userId: context.userId,
        title: "Adaptasi disetujui",
        body: "Satu versi adaptasi siap diterbitkan ke siswa.",
        type: "review",
        link: `/dashboard/materi/${row.materialId}/adaptasi`,
      });
    });

    revalidatePath("/dashboard/materi");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Adaptasi disetujui." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Adaptasi gagal disetujui.",
    );
  }
}

/** Simpan suntingan guru beserta catatan riwayat revisi. */
export async function saveAdaptationAction(input: {
  adaptationId: string;
  adaptedContent: unknown;
  note: string;
}): Promise<ActionResult> {
  const content = adaptedContentSchema.safeParse(input.adaptedContent);
  if (!content.success) {
    return fail("Struktur adaptasi tidak valid, suntingan dibatalkan.");
  }

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const rows = await tx
        .update(materialAdaptations)
        .set({
          adaptedContent: content.data,
          status: "edited",
          teacherEdits: sql`(coalesce(${materialAdaptations.teacherEdits}, '[]'::jsonb) || ${JSON.stringify([
            {
              at: new Date().toISOString(),
              note: input.note.slice(0, 300),
              sectionIndex: 0,
            },
          ])}::jsonb)`,
        })
        .where(eq(materialAdaptations.id, input.adaptationId))
        .returning({ id: materialAdaptations.id });
      if (rows.length === 0) throw new Error("Adaptasi tidak ditemukan.");
    });

    revalidatePath("/dashboard/materi", "layout");
    return { ok: true, message: "Suntingan tersimpan di server." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Suntingan gagal disimpan.");
  }
}

/** Tolak versi adaptasi; siswa tetap memakai versi yang sudah disetujui. */
export async function rejectAdaptationAction(input: {
  adaptationId: string;
  note: string;
}): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const rows = await tx
        .update(materialAdaptations)
        .set({
          status: "rejected",
          approvedAt: null,
          teacherEdits: sql`(coalesce(${materialAdaptations.teacherEdits}, '[]'::jsonb) || ${JSON.stringify([
            {
              at: new Date().toISOString(),
              note: input.note.slice(0, 300),
              sectionIndex: 0,
            },
          ])}::jsonb)`,
        })
        .where(eq(materialAdaptations.id, input.adaptationId))
        .returning({ id: materialAdaptations.id });
      if (rows.length === 0) throw new Error("Adaptasi tidak ditemukan.");
    });

    revalidatePath("/dashboard/materi", "layout");
    return { ok: true, message: "Versi adaptasi ditolak." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Adaptasi gagal ditolak.");
  }
}

/** Terbitkan materi; hanya boleh bila minimal satu adaptasi disetujui. */
export async function publishMaterialAction(
  materialId: string,
): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const [material] = await tx
        .select({ title: materials.title })
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1);
      if (!material) throw new Error("Materi tidak ditemukan.");

      const [approved] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(materialAdaptations)
        .where(
          and(
            eq(materialAdaptations.materialId, materialId),
            eq(materialAdaptations.status, "approved"),
          ),
        );
      if (!approved || approved.total === 0) {
        throw new Error(
          "Materi belum bisa diterbitkan. Setujui minimal satu versi adaptasi terlebih dahulu.",
        );
      }

      await tx
        .update(materials)
        .set({ status: "published" })
        .where(eq(materials.id, materialId));

      await tx.insert(notifications).values({
        userId: context.userId,
        title: `Materi "${material.title}" terbit`,
        body: `${approved.total} versi adaptasi aktif untuk siswa.`,
        type: "system",
        link: `/dashboard/materi/${materialId}`,
      });
    });

    revalidatePath(`/dashboard/materi/${materialId}`);
    revalidatePath("/dashboard/materi");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Materi diterbitkan ke siswa." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Materi gagal diterbitkan.",
    );
  }
}