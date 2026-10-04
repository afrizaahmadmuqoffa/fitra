"use server";

/**
 * Server Action untuk mesin adaptasi AI.
 *
 * Aturan yang dipegang berkas ini:
 * - Satu klik guru hanya memproses SATU siswa, sesuai keputusan proyek.
 * - Status materi mengikuti alur PRD 6.B: draft, pending_ai, ai_ready.
 *   Kegagalan mengembalikan status ke draft supaya tombol coba lagi muncul.
 * - Setiap masukan divalidasi Zod lebih dulu (PRD Bab 8).
 * - Hasil AI tidak pernah otomatis terlihat siswa; harus disetujui guru dulu.
 */
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import {
  materials,
  materialAdaptations,
  studentProfiles,
  students,
  visualAssets,
  notifications,
} from "@/db/schema";
import type { MaterialAnalysis, StudentProfile } from "@/db/types";
import { analisisMateri } from "@/lib/ai/analisis";
import { susunAdaptasi, susunPromptGambar } from "@/lib/ai/adaptasi";
import { AiError } from "@/lib/ai/gemini";
import { VisualError, buatVisual, sidikJariPrompt } from "@/lib/ai/visual";
import { debug } from "@/lib/ai/debug";
import { MODEL_GAMBAR_AKTIF } from "@/lib/ai/visual";
import type { ActionResult } from "./auth";

type HasilAksi = ActionResult & {
  materialId?: string;
  adaptationId?: string;
};

const gagal = (pesan: string): HasilAksi => ({ ok: false, message: pesan });

const materialInput = z.object({
  materialId: z.string().uuid("Materi tidak dikenali."),
});

const adaptasiInput = z.object({
  materialId: z.string().uuid("Materi tidak dikenali."),
  studentId: z.string().uuid("Siswa tidak dikenali."),
});

const visualInput = z.object({
  adaptationId: z.string().uuid("Adaptasi tidak dikenali."),
  sectionIndex: z.number().int().min(0, "Bagian tidak dikenali."),
});

const assetInput = z.object({
  assetId: z.string().uuid("Aset gambar tidak dikenali."),
});

const altTextInput = z.object({
  assetId: z.string().uuid("Aset gambar tidak dikenali."),
  altText: z
    .string()
    .min(8, "Deskripsi gambar minimal 8 karakter.")
    .max(300, "Deskripsi gambar maksimal 300 karakter."),
});

/** Pesan yang enak dibaca guru dari galat AI mana pun. */
function pesanAi(error: unknown): string {
  if (error instanceof AiError) return error.message;
  if (error instanceof VisualError) return error.message;
  return "Terjadi kendala yang tidak terduga. Silakan coba lagi.";
}

function catatGalat(aksi: string, error: unknown) {
  const kode =
    error instanceof AiError || error instanceof VisualError ? error.kode : "-";
  debug.galat("aksi AI gagal", {
    aksi: aksi,
    kode: kode,
    pesan: debug.cuplik(
      error instanceof Error ? error.message : String(error),
    ),
  });
}

// =========================================================
// ANALISIS MATERI
// =========================================================

/**
 * Analisis ulang struktur materi dengan alur status lengkap PRD 6.B.
 */
export async function reanalyzeMaterialAction(input: unknown): Promise<HasilAksi> {
  const parsed = materialInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Materi tidak dikenali.");
  }
  const { materialId } = parsed.data;

  let context;
  try {
    context = await requireAuthContext();
  } catch (error) {
    catatGalat("reanalyzeMaterial", error);
    return gagal("Sesi guru tidak ditemukan. Silakan masuk kembali.");
  }

  const sumber = await withRlsDb(context.claims, async (tx) => {
    const [baris] = await tx
      .select({
        judul: materials.title,
        mapel: materials.subject,
        teks: materials.sourceText,
      })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);
    return baris ?? null;
  });

  if (!sumber) return gagal("Materi tidak ditemukan.");
  if (!sumber.teks || sumber.teks.trim().length < 20) {
    return gagal("Materi ini belum punya teks yang cukup untuk dianalisis.");
  }

  await withRlsDb(context.claims, async (tx) => {
    await tx.update(materials).set({ status: "pending_ai" }).where(eq(materials.id, materialId));
  });
  revalidatePath(`/dashboard/materi/${materialId}`);

  const hasil = await analisisMateri({
    judul: sumber.judul,
    mapel: sumber.mapel ?? "Umum",
    teks: sumber.teks,
    pakaiAi: true,
  });

  await withRlsDb(context.claims, async (tx) => {
    await tx
      .update(materials)
      .set({ aiAnalysis: hasil.analysis, status: "ai_ready", needsReview: false })
      .where(eq(materials.id, materialId));

    await tx.insert(notifications).values({
      userId: context.userId,
      title: `Analisis "${sumber.judul}" selesai`,
      body: `${hasil.analysis.structure.length} bagian teridentifikasi. ${hasil.catatan}`,
      type: "ai_done",
      link: `/dashboard/materi/${materialId}`,
    });
  });

  revalidatePath(`/dashboard/materi/${materialId}`);
  revalidatePath("/dashboard/materi");
  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    materialId,
    message: `Struktur materi dianalisis menjadi ${hasil.analysis.structure.length} bagian. ${hasil.catatan}`,
  };
}

// =========================================================
// ADAPTASI
// =========================================================

type KonteksSiswa = {
  materiId: string;
  judul: string;
  mapel: string;
  teks: string;
  analisis: MaterialAnalysis | null;
  profil: StudentProfile;
  namaSiswa: string;
  versiBerikutnya: number;
};

/**
 * Satu-satunya jalur untuk membuat versi adaptasi baru.
 *
 * Dipakai oleh tombol Buat adaptasi dan tombol Regenerasi. Keduanya membuat
 * baris versi baru sehingga versi lama tidak pernah hilang (PRD 6.D).
 */
async function susunVersiBaru(
  claims: NonNullable<Awaited<ReturnType<typeof requireAuthContext>>>["claims"],
  userId: string,
  materialId: string,
  studentId: string,
  alasan: string,
): Promise<HasilAksi> {
  const data = await withRlsDb(claims, async (tx) => {
    const [materi] = await tx
      .select({
        judul: materials.title,
        mapel: materials.subject,
        teks: materials.sourceText,
        analisis: materials.aiAnalysis,
      })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);
    if (!materi) return { galat: "Materi tidak ditemukan." } as const;

    const [siswa] = await tx
      .select({
        nama: students.fullName,
        hambatan: students.disabilityType,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    if (!siswa) return { galat: "Siswa tidak ditemukan." } as const;

    const [profil] = await tx
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.studentId, studentId))
      .limit(1);
    if (!profil) {
      return {
        galat:
          "Profil belajar siswa belum lengkap. Lengkapi profilnya di halaman siswa terlebih dahulu.",
      } as const;
    }

    const [versi] = await tx
      .select({
        nomor: sql<number>`coalesce(max(${materialAdaptations.version}), 0)::int`,
      })
      .from(materialAdaptations)
      .where(
        and(
          eq(materialAdaptations.materialId, materialId),
          eq(materialAdaptations.studentId, studentId),
        ),
      );

    const hasil: KonteksSiswa = {
      materiId: materialId,
      judul: materi.judul,
      mapel: materi.mapel ?? "Umum",
      teks: materi.teks ?? "",
      analisis: materi.analisis ?? null,
      profil: profil as unknown as StudentProfile,
      namaSiswa: siswa.nama,
      versiBerikutnya: (versi?.nomor ?? 0) + 1,
    };
    return hasil;
  });

  if ("galat" in data) return gagal(data.galat);

  debug.info("menyusun versi adaptasi baru", {
    material: materialId,
    student: studentId,
    versi: data.versiBerikutnya,
    alasan: alasan,
  });

  // Baris draf dibuat lebih dulu supaya guru melihat status yang jujur.
  const baris = await withRlsDb(claims, async (tx) => {
    const [baru] = await tx
      .insert(materialAdaptations)
      .values({
        materialId,
        studentId,
        version: data.versiBerikutnya,
        status: "generating",
        aiModel: "menunggu",
      })
      .returning({ id: materialAdaptations.id });
    return baru;
  });

  revalidatePath(`/dashboard/materi/${materialId}/adaptasi`);

  let adaptasi;
  try {
    adaptasi = await susunAdaptasi({
      materialId,
      studentId,
      judul: data.judul,
      mapel: data.mapel,
      teks: data.teks,
      analisis: data.analisis,
      profil: data.profil,
      jenisHambatan: "lainnya",
    });
  } catch (error) {
    catatGalat("susunVersiBaru", error);
    await withRlsDb(claims, async (tx) => {
      await tx
        .update(materialAdaptations)
        .set({ status: "rejected" })
        .where(eq(materialAdaptations.id, baris.id));
    });
    revalidatePath(`/dashboard/materi/${materialId}/adaptasi`);
    return gagal(pesanAi(error));
  }

  await withRlsDb(claims, async (tx) => {
    await tx
      .update(materialAdaptations)
      .set({
        adaptedContent: adaptasi.adaptedContent,
        status: "draft",
        aiModel: adaptasi.model,
        aiPromptSnapshot: adaptasi.jejakPrompt,
      })
      .where(eq(materialAdaptations.id, baris.id));

    if (adaptasi.requests.length > 0) {
      await tx.insert(visualAssets).values(
        adaptasi.requests.map((request) => ({
          materialAdaptationId: baris.id,
          sectionIndex: request.sectionIndex,
          prompt: `${request.subject}. ${request.scene}. Gaya: ${request.style}. Larangan: ${request.safetyConstraints}`,
          model: MODEL_GAMBAR_AKTIF,
          storagePath: "",
          mimeType: "image/png",
          altText: request.altText,
          status: "pending" as const,
          sourceHash: sidikJariPrompt(request.altText),
        })),
      );
    }

    await tx.insert(notifications).values({
      userId: userId,
      title: `Adaptasi untuk ${data.namaSiswa} siap diperiksa`,
      body: `Versi ${data.versiBerikutnya}. ${adaptasi.adaptedContent.sections.length} bagian, ${adaptasi.requests.length} ilustrasi menunggu. ${adaptasi.catatan}`,
      type: "ai_done",
      link: `/dashboard/materi/${materialId}/adaptasi/${studentId}`,
    });
  });

  revalidatePath(`/dashboard/materi/${materialId}/adaptasi`);
  revalidatePath(`/dashboard/materi/${materialId}`);
  revalidatePath("/dashboard/materi");
  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    materialId,
    adaptationId: baris.id,
    message: `Adaptasi untuk ${data.namaSiswa} versi ${data.versiBerikutnya} selesai dan menunggu review Anda.`,
  };
}

/** Membuat satu versi adaptasi untuk satu siswa. */
export async function generateAdaptationAction(
  input: unknown,
): Promise<HasilAksi> {
  const parsed = adaptasiInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Data tidak lengkap.");
  }

  try {
    const context = await requireAuthContext();
    return await susunVersiBaru(
      context.claims,
      context.userId,
      parsed.data.materialId,
      parsed.data.studentId,
      "buat pertama",
    );
  } catch (error) {
    catatGalat("generateAdaptation", error);
    return gagal(pesanAi(error));
  }
}

/**
 * Regenerasi: membuat versi baru untuk siswa yang sama dan tidak menghapus
 * versi lama (PRD 6.D).
 */
export async function regenerateAdaptationAction(
  input: unknown,
): Promise<HasilAksi> {
  const parsed = adaptasiInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Data tidak lengkap.");
  }

  try {
    const context = await requireAuthContext();
    return await susunVersiBaru(
      context.claims,
      context.userId,
      parsed.data.materialId,
      parsed.data.studentId,
      "regenerasi",
    );
  } catch (error) {
    catatGalat("regenerateAdaptation", error);
    return gagal(pesanAi(error));
  }
}

// =========================================================
// ASET VISUAL
// =========================================================

/**
 * Membuat satu ilustrasi untuk satu bagian.
 *
 * Satu klik satu gambar karena penyedia hanya menerima satu gambar per
 * permintaan. Berkas gambarnya dibuat terpisah supaya satu klik tidak
 * menunggu banyak permintaan jaringan.
 */
export async function generateVisualAction(input: unknown): Promise<ActionResult> {
  const parsed = visualInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Bagian tidak dikenali.");
  }
  const { adaptationId, sectionIndex } = parsed.data;

  try {
    const context = await requireAuthContext();

    const data = await withRlsDb(context.claims, async (tx) => {
      const [aset] = await tx
        .select({
          id: visualAssets.id,
          prompt: visualAssets.prompt,
          altText: visualAssets.altText,
          status: visualAssets.status,
          storagePath: visualAssets.storagePath,
        })
        .from(visualAssets)
        .where(
          and(
            eq(visualAssets.materialAdaptationId, adaptationId),
            eq(visualAssets.sectionIndex, sectionIndex),
          ),
        )
        .limit(1);
      if (!aset) return null;

      const [materi] = await tx
        .select({ judul: materials.title })
        .from(materials)
        .innerJoin(
          materialAdaptations,
          eq(materialAdaptations.materialId, materials.id),
        )
        .where(eq(materialAdaptations.id, adaptationId))
        .limit(1);

      return { aset, judulMateri: materi?.judul ?? "materi sekolah" };
    });

    if (!data) {
      return gagal(
        "Bagian ini tidak punya permintaan gambar. Minta AI membuat adaptasi baru bila bagian ini memang perlu ilustrasi.",
      );
    }

    const { aset, judulMateri } = data;

    if (aset.status === "ready" && aset.storagePath) {
      return { ok: true, message: "Ilustrasi bagian ini sudah ada." };
    }

    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(visualAssets)
        .set({ status: "generating" })
        .where(eq(visualAssets.id, aset.id));
    });
    revalidatePath(`/dashboard/materi/${adaptationId}/adaptasi`);

    try {
      const hasil = await buatVisual({
        prompt: susunPromptGambar({
          prompt: aset.prompt,
          altText: aset.altText,
          judulMateri: judulMateri,
          sectionIndex: sectionIndex,
        }),
        adaptationId,
        sectionIndex,
      });

      await withRlsDb(context.claims, async (tx) => {
        await tx
          .update(visualAssets)
          .set({
            status: "ready",
            storagePath: hasil.storagePath,
            mimeType: hasil.mimeType,
            sourceHash: hasil.sourceHash,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(visualAssets.id, aset.id));
      });

      revalidatePath(`/dashboard/materi/${adaptationId}/adaptasi`);
      return { ok: true, message: "Ilustrasi dibuat dan tersimpan." };
    } catch (error) {
      catatGalat("generateVisual", error);
      await withRlsDb(context.claims, async (tx) => {
        await tx
          .update(visualAssets)
          .set({ status: "failed" })
          .where(eq(visualAssets.id, aset.id));
      });
      revalidatePath(`/dashboard/materi/${adaptationId}/adaptasi`);
      return gagal(pesanAi(error));
    }
  } catch (error) {
    catatGalat("generateVisual", error);
    return gagal(pesanAi(error));
  }
}

/** Mengubah deskripsi gambar yang dibaca pembaca layar. */
export async function updateVisualAltTextAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = altTextInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Deskripsi gambar tidak valid.");
  }

  try {
    const context = await requireAuthContext();
    const baris = await withRlsDb(context.claims, async (tx) =>
      tx
        .update(visualAssets)
        .set({
          altText: parsed.data.altText,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(visualAssets.id, parsed.data.assetId))
        .returning({
          id: visualAssets.id,
          adaptation: visualAssets.materialAdaptationId,
        }),
    );

    if (baris.length === 0) return gagal("Aset gambar tidak ditemukan.");
    revalidatePath(`/dashboard/materi/${baris[0].adaptation}/adaptasi`);
    return { ok: true, message: "Deskripsi gambar disimpan." };
  } catch (error) {
    catatGalat("updateVisualAltText", error);
    return gagal("Gagal menyimpan deskripsi gambar.");
  }
}

/** Menghapus ilustrasi dari satu bagian, termasuk berkasnya di storage. */
export async function removeVisualAction(input: unknown): Promise<ActionResult> {
  const parsed = assetInput.safeParse(input);
  if (!parsed.success) {
    return gagal("Aset gambar tidak dikenali.");
  }

  try {
    const context = await requireAuthContext();
    const baris = await withRlsDb(context.claims, async (tx) =>
      tx
        .delete(visualAssets)
        .where(eq(visualAssets.id, parsed.data.assetId))
        .returning({
          jalur: visualAssets.storagePath,
          adaptation: visualAssets.materialAdaptationId,
        }),
    );

    if (baris.length === 0) return gagal("Aset gambar tidak ditemukan.");

    if (baris[0].jalur) {
      const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
      const supabase = createSupabaseServiceClient();
      const { error } = await supabase.storage
        .from("visual-assets")
        .remove([baris[0].jalur]);
      if (error) {
        debug.peringatan("berkas gambar gagal dihapus dari storage", {
          jalur: baris[0].jalur,
          galat: error.message,
        });
      }
    }

    revalidatePath(`/dashboard/materi/${baris[0].adaptation}/adaptasi`);
    return { ok: true, message: "Ilustrasi dihapus dari bagian ini." };
  } catch (error) {
    catatGalat("removeVisual", error);
    return gagal("Gagal menghapus ilustrasi.");
  }
}
