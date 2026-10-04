/**
 * Analisis struktur materi.
 *
 * Jalur utama memakai Gemini. Bila Gemini gagal, analisis lokal dari
 * src/lib/material-analysis.ts dipakai sebagai cadangan supaya fitur tidak
 * pernah mati total. PRD 6.B meminta status kembali ke draft dengan pesan
 * error dan tombol coba lagi; pemanggil yang mengatur status itu.
 */
import { analyzeMaterialText } from "@/lib/material-analysis";
import type { MaterialAnalysis } from "@/db/types";
import { AiError, generateJson, TIMEOUT } from "./gemini";
import { debug } from "./debug";
import { SKEMA_ANALISIS, ZodAnalisis, keAnalisis } from "./schema";
import { bangunPromptAnalisis, SISTEM_ANALISIS } from "./prompt";

export type HasilAnalisis = {
  analysis: MaterialAnalysis;
  /** True bila hasil came dari AI, false bila dari analisis lokal. */
  dariAi: boolean;
  /** Alasan memakai cadangan, untuk ditampilkan ke guru. */
  catatan: string;
};

/**
 * Menganalisis materi. Tidak pernah melempar error: kalau AI gagal, hasil
 * lokal dikembalikan beserta alasannya.
 */
export async function analisisMateri(input: {
  judul: string;
  mapel: string;
  teks: string;
  /** Guru bisa mematikan AI lewat parameter ini. */
  pakaiAi: boolean;
}): Promise<HasilAnalisis> {
  if (!input.pakaiAi) {
    debug.info("analisis memakai metode lokal, AI dimatikan");
    return {
      analysis: analyzeMaterialText(input.teks, input.judul),
      dariAi: false,
      catatan: "Analisis struktur memakai metode lokal.",
    };
  }

  try {
    const hasil = await generateJson({
      sistem: SISTEM_ANALISIS,
      prompt: bangunPromptAnalisis({
        judul: input.judul,
        mapel: input.mapel,
        teks: input.teks,
      }),
      schema: SKEMA_ANALISIS,
      validasi: ZodAnalisis,
      label: "analisis materi",
      timeoutMs: TIMEOUT.analisis,
    });

    const analysis = keAnalisis(hasil.data, input.judul);
    debug.info("analisis selesai", {
      dari_ai: true,
      jumlah_bagian: analysis.structure.length,
      tingkat: analysis.estimatedReadingLevel,
      bagian_bergambar: analysis.visualSections.length,
      token_keluar: hasil.usage?.outputTokens ?? null,
    });

    return {
      analysis,
      dariAi: true,
      catatan: "Struktur materi dianalisis dengan bantuan AI.",
    };
  } catch (error) {
    const pesan =
      error instanceof AiError
        ? error.message
        : "Analisis AI gagal sehingga dipakai metode lokal.";

    debug.galat("analisis AI gagal, pakai metode lokal", {
      kode: error instanceof AiError ? error.kode : "tidak-diketahui",
      pesan: debug.cuplik(pesan),
    });

    return {
      analysis: analyzeMaterialText(input.teks, input.judul),
      dariAi: false,
      catatan: pesan,
    };
  }
}
