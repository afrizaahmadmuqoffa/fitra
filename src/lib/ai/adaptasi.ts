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
 * Menggabungkan prompt gambar yang disimpan AI menjadi satu prompt lengkap
 * untuk Pollinations.
 *
 * Pollinations menerima satu gambar per permintaan, jadi tiap bagian yang
 * meminta visual diproses terpisah. Gaya dan larangan gambar ikut disertakan
 * supaya hasil antar bagian konsisten dan aman untuk anak.
 */
export function susunPromptGambar(input: {
  prompt: string;
  altText: string;
  judulMateri: string;
  sectionIndex: number;
}): string {
  return [
    "Buat satu ilustrasi edukatif untuk anak sekolah luar biasa di Indonesia.",
    "",
    `KONTEKS MATERI: ${input.judulMateri}, bagian ${input.sectionIndex + 1}.`,
    `APA YANG HARUS DIGAMBAR: ${input.prompt}`,
    "",
    "GAYA GAMBAR:",
    "- Ilustrasi datar seperti buku pelajaran SD Indonesia, digambar tangan",
    "- Garis tepi hitam tebal mengelilingi setiap bentuk",
    "- Bentuk geometris sederhana: lingkaran, persegi, segitiga, oval",
    "- Wajah digambar sangat sederhana: dua titik mata dan garis mulut",
    "- Warna cerah tetapi tidak menyilaukan",
    "",
    "PENCAHAYAAN DAN WARNA:",
    "- Cahaya merata dari semua arah, tanpa bayangan yang dramatik",
    "- Langit biru muda dan tanah hijau muda saat diperlukan",
    "- Fokus warna pada objek utama, latar tidak ramai",
    "",
    "KOMPOSISI:",
    "- Satu objek utama di tengah gambar",
    "- Pandangan lurus dari depan, sudut pandang sederhana",
    "- Proporsi badan sederhana dan tidak detail",
    "",
    "LATAR:",
    "- Putih bersih atau warna sangat muda",
    "- Tidak ada objek lain yang mengganggu",
    "",
    "DILARANG KERAS:",
    "- Tidak ada tulisan, huruf, angka, atau label di dalam gambar",
    "- Tidak ada wajah orang sungguhan atau foto",
    "- Tidak ada kekerasan, senjata, darah, atau monster",
    "- Tidak ada logo atau watermark di gambar",
    "- Tidak ada detail yang terlalu realistis atau gelap",
    "- Tidak ada gaya atau budaya dari luar Indonesia",
  ].join("\n");
}
