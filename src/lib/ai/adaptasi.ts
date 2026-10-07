/**
 * Menyusun satu versi adaptasi untuk satu siswa.
 *
 * PRD 6.C: setiap materi dapat memiliki banyak adaptasi, satu per siswa target.
 * Semua hasil AI berstatus draf dan tidak boleh terlihat siswa sebelum guru
 * menyetujui. Fungsi ini tidak pernah menyentuh database; pemanggil
 * Server Action yang menulis hasilnya.
 */
import type { AdaptedContent, MaterialAnalysis, StudentProfile } from "@/db/types";
import { AiError, generateJson, MODEL_TEKS, TIMEOUT } from "./gemini";
import { debug } from "./debug";
import { SKEMA_ADAPTASI, ZodAdaptasi, keAdaptedContent, type PermintaanVisual } from "./schema";
import {
  bangunPromptAdaptasi,
  keSnapshotProfil,
  SISTEM_ADAPTASI,
  snapshotUntukArsip,
  type SnapshotProfil,
} from "./prompt";

export type HasilAdaptasi = {
  adaptedContent: AdaptedContent;
  /** Permintaan gambar yang diputuskan AI, satu per bagian. */
  requests: PermintaanVisual[];
  /** Jejak prompt untuk kolom aiPromptSnapshot (PRD 6.C). */
  jejakPrompt: string;
  model: string;
  /** Catatan untuk guru, ditampilkan di editor. */
  catatan: string;
};

/**
 * Satu pemanggilan AI untuk satu siswa.
 *
 * Melempar AiError kalau gagal supaya Server Action bisa mengembalikan pesan
 * ke guru dan mengembalikan status materi ke draft dengan tombol coba lagi.
 */
export async function susunAdaptasi(input: {
  materialId: string;
  studentId: string;
  judul: string;
  mapel: string;
  teks: string;
  analisis: MaterialAnalysis | null;
  profil: StudentProfile;
  jenisHambatan: Parameters<typeof keSnapshotProfil>[1];
}): Promise<HasilAdaptasi> {
  const snapshot: SnapshotProfil = keSnapshotProfil(input.profil, input.jenisHambatan);

  debug.info("menyusun adaptasi", {
    material: input.materialId,
    student: input.studentId,
    tingkat: snapshot.tingkatAkademik,
    hambatan: snapshot.jenisHambatan,
    panjang_materi: input.teks.length,
    mode_interaksi: snapshot.modeInteraksi.join("+"),
  });

  const hasil = await generateJson({
    sistem: SISTEM_ADAPTASI,
    prompt: bangunPromptAdaptasi({
      judul: input.judul,
      mapel: input.mapel,
      teks: input.teks,
      analisis: input.analisis,
      profil: snapshot,
    }),
    schema: SKEMA_ADAPTASI,
    validasi: ZodAdaptasi,
    label: "adaptasi materi",
    timeoutMs: TIMEOUT.adaptasi,
  });

  const konten = keAdaptedContent(hasil.data, input.studentId);

  debug.info("adaptasi selesai", {
    material: input.materialId,
    student: input.studentId,
    jumlah_bagian: konten.sections.length,
    jumlah_soal: konten.sections.reduce((total, bagian) => total + bagian.interactions.length, 0),
    permintaan_gambar: konten.requests.length,
    token_masuk: hasil.usage?.inputTokens ?? null,
    token_keluar: hasil.usage?.outputTokens ?? null,
  });

  if (konten.sections.length === 0) {
    throw new AiError(
      "Adaptasi yang dihasilkan tidak memuat bagian apa pun. Silakan coba lagi.",
      "bagian-kosong",
    );
  }

  return {
    adaptedContent: {
      sections: konten.sections,
      readingLevel: konten.readingLevel,
      generatedFor: konten.generatedFor,
    },
    requests: konten.requests,
    jejakPrompt: snapshotUntukArsip(input.materialId, input.studentId, snapshot),
    model: MODEL_TEKS,
    catatan: hasil.data.adaptationNotes,
  };
}

/**
 * Membangun prompt positif Bahasa Inggris siap pakai untuk Pollinations.
 *
 * `promptEn` berisi `scene` dari Gemini — deskripsi subjek, jumlah, warna,
 * dan konteks dalam satu kalimat. Style ditambahkan di sini oleh server,
 * bukan dari Gemini, sehingga gaya ilustrasi selalu konsisten.
 *
 * Negative prompt dipisah ke konstanta NEGATIVE_PROMPT dan dikirim
 * sebagai parameter terpisah ke Pollinations API (no. 4).
 */

/** Negative tags untuk image generation — dikirim sebagai `negative_prompt` terpisah. */
export const NEGATIVE_PROMPT = [
  "text, letters, numbers, words, labels, watermark, logo",
  "photorealism, photograph, 3d render",
  "dark themes, violence, gore, weapons",
  "border, frame, vignette",
  "multiple main subjects, busy background, cluttered scene",
  "human faces, cartoon people, children figures",
].join(", ");

export function susunPromptGambar(input: {
  /** Scene description dalam Bahasa Inggris dari Gemini — subjek, jumlah, warna, konteks. */
  promptEn: string;
}): string {
  return [
    // Scene dari Gemini — diletakkan pertama agar bobot CLIP maksimal
    input.promptEn,
    // Style dikontrol server — tidak pernah datang dari Gemini
    "flat illustration, Indonesian elementary school textbook style",
    "thick black outlines, simple geometric shapes",
    "bright cheerful colors, white background",
    "clean composition, single centered main subject",
    "child-friendly educational illustration",
  ].join(", ");
}
