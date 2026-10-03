import type { MaterialAnalysis, MaterialSection } from "@/db/types";

/**
 * Analisis struktur materi tanpa AI (Tahap 2).
 *
 * Memecah teks menjadi sub-bagian berdasarkan penanda heading, menghitung
 * panjang kalimat, menebak tingkat keterbacaan, dan menandai bagian yang
 * butuh ilustrasi. Pada Tahap 3 fungsi ini digantikan `analyzeMaterial`
 * dari Google Gemini dengan kontrak JSON yang sama.
 */

const HEADING = /^(#{1,3}\s+.+|bagian\s+[a-z0-9]+[:.\-]?\s*.*|[0-9]+[.)]\s+\S.*)$/i;

const READING_LEVELS: { maxWords: number; label: string }[] = [
  { maxWords: 8, label: "Sangat sederhana" },
  { maxWords: 14, label: "Sederhana" },
  { maxWords: 22, label: "Sedang" },
  { maxWords: Number.POSITIVE_INFINITY, label: "Kompleks" },
];

function splitSentences(block: string): string[] {
  return block
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function analyzeMaterialText(text: string, title: string): MaterialAnalysis {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const blocks = clean.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  const structure: MaterialSection[] = [];
  let current: MaterialSection | null = null;

  for (const block of blocks) {
    const firstLine = block.split("\n")[0] ?? "";
    const isHeading = HEADING.test(firstLine.trim()) && firstLine.length < 80;
    if (isHeading || !current) {
      current = {
        title: isHeading ? firstLine.replace(HEADING, "$1").trim() : `Bagian ${structure.length + 1}`,
        summary: splitSentences(block.replace(firstLine, "")).slice(0, 2).join(" "),
        keyTerms: [],
      };
      structure.push(current);
      continue;
    }

    const sentences = splitSentences(block);
    current.summary = sentences.slice(0, 2).join(" ");
    current.keyTerms = Array.from(
      new Set(
        sentences
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z\s]/g, " ")
          .split(/\s+/)
          .filter((word) => word.length > 5),
      ),
    ).slice(0, 6);
  }

  const allSentences = splitSentences(clean.replace(/\n+/g, " "));
  const averageWords =
    allSentences.length === 0
      ? 0
      : allSentences.reduce((total, sentence) => total + sentence.split(" ").length, 0) /
        allSentences.length;

  const estimatedReadingLevel =
    READING_LEVELS.find((item) => averageWords <= item.maxWords)?.label ??
    READING_LEVELS[READING_LEVELS.length - 1].label;

  const visualSections = structure
    .filter((section) =>
      /gambar|ilustrasi|contoh|lihat|perhatikan|warna|anggota|hewan|tumbuhan/i.test(
        `${section.title} ${section.summary}`,
      ),
    )
    .map((section) => structure.indexOf(section));

  return {
    structure: structure.length > 0 ? structure : [{ title, summary: "", keyTerms: [] }],
    estimatedReadingLevel,
    visualSections,
    summary:
      allSentences.slice(0, 2).join(" ") ||
      "Materi ini belum memiliki kalimat yang dapat dianalisis.",
  };
}