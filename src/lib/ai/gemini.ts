/**
 * Klien Gemini untuk semua fitur AI Fitra. KHASUS SERVER.
 *
 * Jangan pernah mengimpor berkas ini dari komponen klien. Kunci API hanya
 * boleh hidup di server (PRD Bab 8: secret tidak memakai prefix
 * NEXT_PUBLIC_ dan tidak pernah dikirim ke browser).
 *
 * Kontrak penting modul ini:
 * - Respons model SELALU divalidasi dua lapis: JSON Schema saat dikirim ke
 *   model, lalu Zod lagi di sisi server. Output model bukan jaminan.
 * - Kegagalan sementara (503/high demand, 429) dicoba ulang dengan
 *   exponential backoff, karena keduanya hal wajar dan sering terjadi.
 * - Pesan error ditulis dalam bahasa guru, bukan dump teknis.
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { debug } from "./debug";

/** PRD Bab 10 menyebut gemini-3.8-flash; env dipakai agar bisa ditukar tanpa ubah kode. */
export const MODEL_TEKS = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.8-flash";

/** Batas waktu satu panggilan. Analisis lebih cepat daripada generasi adaptasi. */
const TIMEOUT_ANALISIS_MS = 90_000;
const TIMEOUT_ADAPTASI_MS = 150_000;

/** Berapa kali percobaan sebelum menyerah pada satu permintaan. */
const PERCOBAAN_MAKS = 3;

let klien: GoogleGenAI | null = null;

/**
 * Klien dibuat sekali lalu dipakai ulang. `apiKey` dibaca saat permintaan
 * pertama, bukan saat modul diimpor, supaya build tanpa env tetap jalan.
 */
function ambilKlien(): GoogleGenAI {
  if (klien) return klien;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "Fitra belum dikonfigurasi untuk memakai AI. Isi GEMINI_API_KEY di pengaturan lingkungan, lalu coba lagi.",
      "kunci-hilang",
    );
  }

  klien = new GoogleGenAI({
    apiKey,
    httpOptions: {
      // Retry dimatikan di sini dengan sengaja. Kalau SDK mencoba sendiri
      // sebanyak 3 kali lalu loop di bawah mencoba lagi 3 kali, satu klik guru
      // bisa jadi 9 permintaan. Semua percobaan dikendalikan satu loop saja
      // supaya jumlah permintaan bisa diprediksi dan galatnya terpetakan ke
      // bahasa guru.
      retryOptions: { attempts: 1 },
    },
  });

  debug.info("klien Gemini dibuat", {
    model: MODEL_TEKS,
    percobaan_maks: PERCOBAAN_MAKS,
    kunci_terisi: apiKey.length,
  });

  return klien;
}

/** Galat AI yang aman ditampilkan ke guru. */
export class AiError extends Error {
  readonly kode: string;

  constructor(pesan: string, kode: string) {
    super(pesan);
    this.name = "AiError";
    this.kode = kode;
  }
}

/** Pesangalat dari SDK diterjemahkan ke bahasa yang bisa dipakai guru. */
function terjemahkanGalat(error: unknown): AiError {
  const mentah = error instanceof Error ? error.message : String(error);

  if (/API key not valid|API_KEY_INVALID|401|403/i.test(mentah)) {
    return new AiError(
      "Kunci API Gemini ditolak oleh Google. Periksa GEMINI_API_KEY di pengaturan lingkungan.",
      "kunci-ditolak",
    );
  }
  if (
    /UNAVAILABLE|high demand|overloaded|\b503\b|429|RESOURCE_EXHAUSTED/i.test(
      mentah,
    )
  ) {
    return new AiError(
      "Layanan AI sedang sangat padat. Coba lagi beberapa saat lagi.",
      "layanan-padat",
    );
  }
  if (/DEADLINE_EXCEEDED|\b504\b|timed? ?out|ETIMEDOUT/i.test(mentah)) {
    return new AiError(
      "Waktu tunggu habis saat memproses materi. Coba lagi dengan materi yang lebih pendek.",
      "waktu-habis",
    );
  }
  if (/SAFETY|blocked|prohibited_content/i.test(mentah)) {
    return new AiError(
      "Sebagian isi materi ditolak oleh penyaring keamanan AI. Periksa kembali teks materi yang diunggah.",
      "ditolak-filter",
    );
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(mentah)) {
    return new AiError(
      "Tidak dapat terhubung ke layanan AI. Periksa koneksi internet server.",
      "jaringan",
    );
  }

  return new AiError(`Gagal memproses materi dengan AI. ${mentah}`, "tidak-diketahui");
}

/** Jeda exponential backoff: 2s, 4s, 8s. */
function tunggu(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type PetaPemakaian = { stamp: number[] };

const jendelaPemakaian = new Map<string, PetaPemakaian>();

/** Berapa permintaan AI yang boleh berjalan dalam satu menit untuk satu guru. */
const BATAS_PERMENIT = 12;

/**
 * Pembatas laju sederhana per guru (PRD Bab 8).
 *
 * Catatan jujur: penyimpanan ini di memori proses, jadi pada Vercel Hobby
 * tiap instance punya hitungan sendiri. Untuk satu akun guru SLB ini sudah
 * cukup; bila nanti dipakai banyak akun bersama, pindahkan ke tabel atau
 * Redis.
 */
export function ambilSlotPemakaian(kunci: string): {
  boleh: boolean;
  tungguSebentar: number;
} {
  const sekarang = Date.now();
  const jendela = (jendelaPemakaian.get(kunci) ?? { stamp: [] }).stamp;
  const aktif = jendela.filter((stamp) => sekarang - stamp < 60_000);

  if (aktif.length >= BATAS_PERMENIT) {
    jendelaPemakaian.set(kunci, { stamp: aktif });
    const terlama = Math.min(...aktif);
    return { boleh: false, tungguSebentar: Math.max(60_000 - (sekarang - terlama), 1000) };
  }

  aktif.push(sekarang);
  jendelaPemakaian.set(kunci, { stamp: aktif });
  return { boleh: true, tungguSebentar: 0 };
}

type OpsiGenerateJson<T> = {
  /** Instruksi sistem yang menetap. */
  sistem: string;
  /** Isi tugas yang berubah. */
  prompt: string;
  /** JSON Schema yang dipakai responseJsonSchema. */
  schema: Record<string, unknown>;
  /** Validasi Zod lapis kedua. */
  validasi: z.ZodType<T>;
  /** Nama pekerjaan untuk pesan error, mis. "analisis materi". */
  label: string;
  timeoutMs?: number;
};

type HasilGenerateJson<T> = {
  data: T;
  /** Token usage bila SDK melaporkannya; berguna untuk biaya. */
  usage: { inputTokens: number; outputTokens: number } | null;
};

function bacaPemakaian(response: unknown): HasilGenerateJson<unknown>["usage"] {
  const usage = (response as { usageMetadata?: Record<string, unknown> })?.usageMetadata;
  if (!usage) return null;
  const input = Number(usage.promptTokenCount ?? 0);
  const output = Number(usage.candidatesTokenCount ?? 0);
  if (!Number.isFinite(input) && !Number.isFinite(output)) return null;
  return { inputTokens: input || 0, outputTokens: output || 0 };
}

/**
 * Satu-satunya jalan keluar modul ini untuk memanggil model.
 *
 * Mengembalikan data yang sudah lolos Zod, jadi pemanggil tidak perlu
 * memeriksa bentuk respons lagi.
 */
export async function generateJson<T>(opsi: OpsiGenerateJson<T>): Promise<HasilGenerateJson<T>> {
  const ai = ambilKlien();

  let galatTerakhir: unknown = null;
  const mulaiKeseluruhan = Date.now();

  debug.info("mulai panggilan AI", {
    label: opsi.label,
    model: MODEL_TEKS,
    panjang_prompt: opsi.prompt.length,
    timeout_ms: opsi.timeoutMs ?? TIMEOUT_ADAPTASI_MS,
  });

  for (let percobaan = 1; percobaan <= PERCOBAAN_MAKS; percobaan += 1) {
    const mulaiPercobaan = Date.now();
    try {
      const response = await ai.models.generateContent({
        model: MODEL_TEKS,
        contents: [
          {
            role: "user",
            parts: [{ text: opsi.prompt }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: opsi.schema,
          httpOptions: { timeout: opsi.timeoutMs ?? TIMEOUT_ADAPTASI_MS },
          systemInstruction: opsi.sistem,
        },
      });

      const teks = response.text ?? "";
      const usage = bacaPemakaian(response);
      debug.info("respons AI diterima", {
        label: opsi.label,
        percobaan: percobaan,
        durasi_ms: Date.now() - mulaiPercobaan,
        panjang_respons: teks.length,
        token_masuk: usage?.inputTokens ?? null,
        token_keluar: usage?.outputTokens ?? null,
        alasan_selesai: (response as { candidates?: { finishReason?: string }[] })
          ?.candidates?.[0]?.finishReason ?? null,
      });

      if (!teks.trim()) {
        debug.galat("respons AI kosong", { label: opsi.label, percobaan: percobaan });
        throw new AiError(
          `Model tidak mengembalikan isi untuk ${opsi.label}.`,
          "respons-kosong",
        );
      }

      let json: unknown;
      try {
        json = JSON.parse(teks);
      } catch {
        debug.galat("respons AI bukan JSON valid", {
          label: opsi.label,
          awalan_respons: debug.cuplik(teks),
        });
        throw new AiError(
          `Format jawaban AI untuk ${opsi.label} tidak bisa dibaca. Silakan coba lagi.`,
          "json-invalid",
        );
      }

      const hasil = opsi.validasi.safeParse(json);
      if (!hasil.success) {
        const rincian = hasil.error.issues
          .slice(0, 5)
          .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
          .join("; ");
        debug.galat("validasi Zod gagal", {
          label: opsi.label,
          jumlah_masalah: hasil.error.issues.length,
          rincian: debug.cuplik(rincian),
        });
        throw new AiError(
          `Jawaban AI untuk ${opsi.label} tidak lengkap (${rincian}). Silakan coba lagi.`,
          "validasi-gagal",
        );
      }

      debug.info("hasil AI lolos validasi", {
        label: opsi.label,
        total_ms: Date.now() - mulaiKeseluruhan,
      });

      return { data: hasil.data, usage: bacaPemakaian(response) };
    } catch (error) {
      galatTerakhir = error;
      const pesan = error instanceof Error ? error.message : String(error);

      debug.peringatan("percobaan AI gagal", {
        label: opsi.label,
        percobaan: percobaan,
        dari: PERCOBAAN_MAKS,
        durasi_ms: Date.now() - mulaiPercobaan,
        galat: debug.cuplik(pesan),
      });

      // Galat yang tidak akan berubah kalau diulang.
      if (error instanceof AiError && error.kode !== "layanan-padat") {
        throw error;
      }

      const masihSisa = percobaan < PERCOBAAN_MAKS;
      if (masihSisa) {
        const jeda = 2000 ** percobaan;
        debug.info("menunggu sebelum mencoba lagi", { jeda_ms: jeda });
        await tunggu(jeda);
        continue;
      }
    }
  }

  const galatFinal = terjemahkanGalat(galatTerakhir);
  debug.galat("permintaan AI gagal total", {
    label: opsi.label,
    kode: galatFinal.kode,
    pesan: galatFinal.message,
    total_ms: Date.now() - mulaiKeseluruhan,
  });
  throw galatFinal;
}

export const TIMEOUT = {
  analisis: TIMEOUT_ANALISIS_MS,
  adaptasi: TIMEOUT_ADAPTASI_MS,
};
