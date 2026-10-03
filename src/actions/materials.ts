"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withRlsDb } from "@/db/rls";
import {
  materialAdaptations,
  materials,
  notifications,
} from "@/db/schema";
import { analyzeMaterialText } from "@/lib/material-analysis";
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

/** Unggah materi: simpan berkas ke bucket privat, ekstraksi teks, analisis struktur. */
export async function createMaterialAction(input: {
  values: unknown;
  file?: File | null;
}): Promise<ActionResult & { materialId?: string }> {
  const parsed = materialInputSchema.safeParse(input.values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data materi belum lengkap.");
  }
  const values = parsed.data;
  const file = input.file ?? null;

  try {
    let sourceText = "";
    let sourceType: "pdf" | "docx" | "text" = "text";
    let sourceUrl: string | null = null;
    let sourceFileName: string | null = null;
    const warnings: string[] = [];

    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "pdf" || file.type === "application/pdf") {
        sourceType = "pdf";
      } else if (extension === "docx") {
        sourceType = "docx";
      } else if (extension === "txt" || file.type.startsWith("text/")) {
        sourceType = "text";
      } else {
        return fail("Format berkas harus PDF, DOCX, atau TXT.");
      }

      const extraction = await extractMaterialText(file);
      sourceText = extraction.text;
      if (extraction.warning) warnings.push(extraction.warning);

      const supabase = await createSupabaseServerClient();
      const path = `materi/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) {
        warnings.push(`Berkas belum tersimpan di storage: ${uploadError.message}`);
      } else {
        sourceUrl = path;
        sourceFileName = file.name;
      }
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

    const analysis = analyzeMaterialText(sourceText, values.title);

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
          aiAnalysis: analysis,
          status: "ai_ready",
        })
        .returning({ id: materials.id });

      if (values.targetStudentIds.length > 0) {
        await tx.insert(materialAdaptations).values(
          values.targetStudentIds.map((studentId) => ({
            materialId: row.id,
            studentId,
            status: "generating" as const,
            aiModel: "analisis-struktur-lokal",
          })),
        );
      }

      await tx.insert(notifications).values({
        userId: context.userId,
        title: `Materi "${values.title.trim()}" selesai dianalisis`,
        body: `${analysis.structure.length} bagian teridentifikasi dengan tingkat keterbacaan ${analysis.estimatedReadingLevel.toLowerCase()}.${values.targetStudentIds.length > 0 ? ` ${values.targetStudentIds.length} siswa masuk antrean adaptasi.` : ""}`,
        type: "ai_done",
        link: `/dashboard/materi/${row.id}`,
      });

      return row.id;
    });

    revalidatePath("/dashboard/materi");
    revalidatePath("/dashboard/materi/baru");
    revalidatePath("/dashboard", "layout");

    const warning = warnings.length > 0 ? ` ${warnings[0]}` : "";
    return {
      ok: true,
      materialId,
      message: `${values.title.trim()} tersimpan dan struktur materinya sudah dianalisis.${warning}`,
    };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Materi gagal disimpan.",
    );
  }
}

/** Analisis ulang struktur materi (dipakai tombol "Proses ulang"). */
export async function analyzeMaterialAgainAction(
  materialId: string,
): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const [row] = await tx
        .select()
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1);
      if (!row) throw new Error("Materi tidak ditemukan.");

      const analysis = analyzeMaterialText(
        row.sourceText ?? "",
        row.title,
      );
      await tx
        .update(materials)
        .set({ aiAnalysis: analysis, status: "ai_ready" })
        .where(eq(materials.id, materialId));

      await tx.insert(notifications).values({
        userId: context.userId,
        title: `Analisis "${row.title}" selesai`,
        body: `${analysis.structure.length} bagian teridentifikasi dengan tingkat keterbacaan ${analysis.estimatedReadingLevel.toLowerCase()}.`,
        type: "ai_done",
        link: `/dashboard/materi/${materialId}`,
      });
    });

    revalidatePath(`/dashboard/materi/${materialId}`);
    revalidatePath("/dashboard/materi");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Analisis struktur materi dijalankan ulang." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Analisis gagal.");
  }
}

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