import mammoth from "mammoth";
import { debug } from "@/lib/ai/debug";

/**
 * Ekstraksi teks dari berkas materi (PDF/DOCX/TXT).
 *
 * PDF memakai unpdf, yaitu redistribute serverless dari PDF.js. Alasan:
 * PDF.js bawaan meminta berkas worker terpisah saat dijalankan di Vercel,
 * dan berkas itu tidak ikut ter-bundle sehingga getDocument() menolak
 * dengan "Setting up fake worker failed". unpdf menyematkan worker langsung
 * ke dalam bundel dan sudah menyertakan polyfill yang dibutuhkan, jadi
 * tidak ada berkas tambahan yang dicari saat runtime.
 */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 20_000;

/** Batas waktu parsing PDF. unpdf berjalan di thread utama, jadi dijaga. */
const PDF_TIMEOUT_MS = 60_000;

export type ExtractionResult = { text: string; warning?: string };

function pesanBatasWaktu(): string {
  const detik = Math.round(PDF_TIMEOUT_MS / 1000);
  return `PDF terlalu besar atau rumit untuk diproses dalam ${detik} detik. Coba berkas lain, atau tempelkan teksnya secara manual.`;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const mulai = Date.now();
  const { extractText, getDocumentProxy } = await import("unpdf");

  const kerja = (async () => {
    const proxy = await getDocumentProxy(new Uint8Array(buffer));
    // mergePages membuat seluruh halaman menyatu jadi satu string.
    const hasil = await extractText(proxy, { mergePages: true });
    const teks: string = hasil.text;

    debug.info("PDF berhasil diekstrak", {
      halaman: hasil.totalPages,
      ukuran_kb: Math.round(buffer.byteLength / 1024),
      durasi_ms: Date.now() - mulai,
      karakter: teks.length,
    });

    return teks;
  })();

  // unpdf mem-parsing di thread utama, jadi panggilan ini perlu dijaga agar
  // satu berkas aneh tidak menahan Server Action sampai batas Vercel.
  let tengah: ReturnType<typeof setTimeout> | null = null;
  const penjaga = new Promise<never>((_, tolak) => {
    tengah = setTimeout(() => tolak(new Error(pesanBatasWaktu())), PDF_TIMEOUT_MS);
  });

  try {
    return await Promise.race([kerja, penjaga]);
  } catch (error) {
    debug.galat("ekstraksi PDF gagal", {
      durasi_ms: Date.now() - mulai,
      ukuran_kb: Math.round(buffer.byteLength / 1024),
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    throw error;
  } finally {
    if (tengah) clearTimeout(tengah);
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.replace(/\r\n/g, "\n").trim();
}

function truncate(text: string): { text: string; warning?: string } {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= MAX_TEXT_LENGTH) return { text: clean };
  return {
    text: clean.slice(0, MAX_TEXT_LENGTH),
    warning: `Teks dipotong pada 20.000 karakter pertama. Bagian berikutnya belum ikut dianalisis.`,
  };
}

export async function extractMaterialText(file: File): Promise<ExtractionResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Ukuran berkas melebihi 20 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase();

  let raw = "";
  if (extension === "pdf" || file.type === "application/pdf") {
    raw = await extractPdf(buffer);
  } else if (extension === "docx") {
    raw = await extractDocx(buffer);
  } else {
    raw = buffer.toString("utf8");
  }

  if (!raw.trim()) {
    return {
      text: "",
      warning:
        "Teks tidak terbaca otomatis. Periksa apakah berkas berisi teks yang bisa disalin, atau tempelkan materi secara manual.",
    };
  }

  return truncate(raw);
}