import mammoth from "mammoth";

/**
 * Ekstraksi teks dari berkas materi (PDF/DOCX/TXT).
 * PDF memakai pdfjs-dist legacy build yang berjalan di Node runtime.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 20_000;

export type ExtractionResult = { text: string; warning?: string };

async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    disableFontFace: true,
  }).promise;

  const pages: string[] = [];
  for (let index = 1; index <= document.numPages; index += 1) {
    const page = await document.getPage(index);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) pages.push(line);
    page.cleanup();
  }
  return pages.join("\n\n");
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