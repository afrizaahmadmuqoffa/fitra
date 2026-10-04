/**
 * Analisis struktur materi.
 *
 * Jalur utama memakai Gemini. Bila Gemini gagal dan allowFallback=true,
 * analisis lokal dipakai sebagai cadangan. Bila allowFallback=false (default),
 * error diteruskan ke caller untuk proper error handling.
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
  /** Catatan untuk guru, ditampilkan di notifikasi. */
  catatan: string;
};

/**
 * Menganalisis materi. Throw error jika AI gagal dan allowFallback=false.
 * Return fallback result jika allowFallback=true.
 */
export async function analisisMateri(input: {
  judul: string;
  mapel: string;
  teks: string;
  /** Guru bisa mematikan AI lewat parameter ini. */
  pakaiAi: boolean;
  /** Allow fallback ke analisis lokal jika AI gagal. Default: false. */
  allowFallback?: boolean;
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
        : "Analisis AI gagal.";

    debug.galat("analisis AI gagal", {
      kode: error instanceof AiError ? error.kode : "tidak-diketahui",
      pesan: debug.cuplik(pesan),
      allow_fallback: input.allowFallback ?? false,
    });

    if (input.allowFallback) {
      return {
        analysis: analyzeMaterialText(input.teks, input.judul),
        dariAi: false,
        catatan: `${pesan} Menggunakan analisis lokal sebagai cadangan.`,
      };
    }

    // Throw error untuk proper handling di caller
    throw error;
  }
}
