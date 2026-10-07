/**
 * Kontrak data untuk keluaran AI.
 *
 * Dua lapis, dan keduanya wajib:
 * 1. JSON Schema dikirim ke model sebagai `responseJsonSchema` supaya model
 *    tidak berhalusinasi bentuk data.
 * 2. Zod dipakai lagi di server setelah respons diterima. Lapis pertama
 *    hanyalah anjuran; lapis kedua adalah jaminan kita
 *    (PRD Bab 8: "sanitasi konten AI sebelum dirender siswa").
 *
 * Catatan sengaja: id TIDAK pernah diminta dari model. Id bagian, id opsi,
 * dan id aset dibuat server sendiri lewat
 * `keAdaptedContent()`, karena id dari model bisa bentrok atau tak terduga.
 */
import { z } from "zod";
import type {
  AdaptedContent,
  AdaptedInteraction,
  AdaptedMedia,
  AdaptedSection,
  MaterialAnalysis,
} from "@/db/types";

// =========================================================
// ANALISIS MATERI
// =========================================================

/**
 * AI tidak diminta memberi indeks bagian, karena indeks adalah posisi di
 * array yang hanya diketahui server. Yang diminta adalah judul bagian, lalu
 * dipetakan ke indeks di `keAnalisis()`.
 */
const zAnalisisAi = z.object({
  summary: z
    .string()
    .min(10, "Ringkasan materi terlalu pendek")
    .max(1200, "Ringkasan materi terlalu panjang"),
  estimatedReadingLevel: z
    .string()
    .min(3)
    .max(80)
    .describe("Tingkat keterbacaan dalam bahasa Indonesia, mis. 'Sederhana'"),
  structure: z
    .array(
      z.object({
        title: z.string().min(2).max(160),
        summary: z.string().min(1).max(1200),
        keyTerms: z.array(z.string().min(1).max(80)).max(12),
      }),
    )
    .min(1, "Materi harus memiliki minimal satu bagian")
    .max(24, "Terlalu banyak bagian; kelompokkan materi yang mirip"),
  visualSectionHints: z
    .array(z.number().int().min(0))
    .max(24)
    .describe("Indeks bagian (0-based) yang mungkin butuh ilustrasi sebagai hint"),
});

export type AnalisisAi = z.infer<typeof zAnalisisAi>;

/** JSON Schema untuk analisis materi. */
export const SKEMA_ANALISIS: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "Ringkasan keseluruhan materi dalam 1-3 kalimat berbahasa Indonesia.",
    },
    estimatedReadingLevel: {
      type: "string",
      description:
        "Tingkat keterbacaan materi sumber, salah satu dari: Sangat sederhana, Sederhana, Sedang, Kompleks.",
    },
    structure: {
      type: "array",
      description: "Pembagian materi menjadi sub-bagian yang dapat diajarkan.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Judul sub-bagian." },
          summary: {
            type: "string",
            description: "Isi inti sub-bagian maksimal 3 kalimat.",
          },
          keyTerms: {
            type: "array",
            description: "Konsep kunci yang harus dipahami siswa.",
            items: { type: "string" },
          },
        },
        required: ["title", "summary", "keyTerms"],
      },
    },
    visualSectionHints: {
      type: "array",
      description:
        "Indeks bagian (0-based) yang mungkin butuh ilustrasi. Ini hint untuk adaptasi, bukan keputusan final. Kosongkan bila seluruh materi bisa dijelaskan tanpa gambar.",
      items: { type: "integer" },
    },
  },
  required: ["summary", "estimatedReadingLevel", "structure", "visualSectionHints"],
};

/** Memetakan keluaran AI ke bentuk `MaterialAnalysis` milik database. */
export function keAnalisis(hasil: AnalisisAi, judulCadangan: string): MaterialAnalysis {
  const struktur = hasil.structure.map((item) => ({
    title: item.title.trim() || judulCadangan,
    summary: item.summary.trim(),
    keyTerms: item.keyTerms.map((kata) => kata.trim()).filter(Boolean),
  }));

  return {
    structure: struktur,
    estimatedReadingLevel: hasil.estimatedReadingLevel.trim(),
    visualSections: hasil.visualSectionHints,
    summary: hasil.summary.trim(),
  };
}

// =========================================================
// ADAPTASI MATERI
// =========================================================

const zOpsiAi = z.object({
  label: z.string().min(1).max(120),
  correct: z.boolean(),
});

const zInteraksiAi = z.object({
  kind: z.enum(["tap", "speech", "drag", "text"]),
  prompt: z.string().min(5).max(400),
  options: z.array(zOpsiAi).max(6),
  acceptedAnswers: z.array(z.string().min(1).max(160)).min(1).max(12),
});

const zPermintaanVisualAi = z.object({
  subject: z.string().min(3).max(200),
  scene: z.string().min(3).max(400),
  safetyConstraints: z.string().max(300),
  altText: z.string().min(8).max(300),
});

const zBagianAi = z.object({
  title: z.string().min(2).max(120),
  body: z.array(z.string().min(1).max(800)).min(2).max(12),
  audioScript: z.string().min(10).max(3000),
  interactions: z.array(zInteraksiAi).max(4),
  hasVisual: z.boolean(),
  visualSpec: zPermintaanVisualAi.nullable(),
});

const zAdaptasiAi = z.object({
  readingLevel: z.string().min(3).max(80),
  adaptationNotes: z.string().max(600),
  sections: z
    .array(zBagianAi)
    .min(1, "Adaptasi harus memiliki minimal satu bagian")
    .max(20, "Terlalu banyak bagian untuk satu materi"),
});

export type AdaptasiAi = z.infer<typeof zAdaptasiAi>;

/** Zod untuk adaptasi, dipakai sebagai validasi lapis kedua di server. */
export const ZodAdaptasi = zAdaptasiAi;

/** Zod untuk analisis, dipakai sebagai validasi lapis kedua di server. */
export const ZodAnalisis = zAnalisisAi;

/** JSON Schema untuk adaptasi materi. */
export const SKEMA_ADAPTASI: Record<string, unknown> = {
  type: "object",
  properties: {
    readingLevel: {
      type: "string",
      description: "Tingkat bahasa yang dipakai hasil adaptasi.",
    },
    adaptationNotes: {
      type: "string",
      description:
        "Catatan singkat untuk guru: apa yang diubah dan mengapa. Maksimal 600 karakter.",
    },
    sections: {
      type: "array",
      description: "Bagian-bagian materi yang sudah disesuaikan untuk satu siswa.",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Judul bagian, maksimal 6 kata, tanpa akhiran titik.",
          },
          body: {
            type: "array",
            description:
              "Isi bagian sebagai kalimat terpisah (3–6 kalimat). Tiap kalimat mengikuti tingkat bahasa siswa. Urutan: gambaran umum → contoh konkret → kaitan kehidupan sehari-hari.",
            items: { type: "string" },
          },
          audioScript: {
            type: "string",
            description:
              "Naskah yang akan dibacakan dengan suara. Harus mencakup SELURUH isi bagian sehingga anak yang tidak melihat layar tetap mendapat informasi lengkap. Bentuknya narasi lisan hangat, bukan daftar poin. Tidak boleh berisi markdown, penanda, atau instruksi apa pun untuk pembaca layar.",
          },
          interactions: {
            type: "array",
            description:
              "Soal atau aktivitas untuk bagian ini. Setiap bagian yang mengandung konsep penting HARUS memiliki minimal satu aktivitas. Boleh kosong hanya untuk bagian pengantar atau transisi.",
            items: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                  description:
                    "Cara siswa menjawab: tap untuk menekan pilihan, speech untuk menjawab dengan suara, text untuk mengetik, drag untuk menyeret.",
                },
                prompt: {
                  type: "string",
                  description: "Pertanyaan atau instruksi aktivitas, satu kalimat.",
                },
                options: {
                  type: "array",
                  description:
                    "Pilihan jawaban. Untuk kind tap atau speech, isi 2 sampai 4 pilihan dan tepat satu bernilai correct true.",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Teks pilihan jawaban." },
                      correct: { type: "boolean", description: "Benar atau salah." },
                    },
                    required: ["label", "correct"],
                  },
                },
                acceptedAnswers: {
                  type: "array",
                  description:
                    "Semua jawaban yang harus diterima benar untuk interaksi ini, dalam huruf kecil. Wajib memuat bentuk kata dan bentuk angka bila relevan, serta varyasi kata yang biasa diucapkan siswa.",
                  items: { type: "string" },
                },
              },
              required: ["kind", "prompt", "options", "acceptedAnswers"],
            },
          },
          hasVisual: {
            type: "boolean",
            description: "Apakah bagian ini butuh ilustrasi.",
          },
          visualSpec: {
            type: "object",
            nullable: true,
            description:
              "Detail ilustrasi jika hasVisual true, null jika tidak butuh gambar. " +
              "Hanya buat gambar bila objeknya benar-benar tidak bisa dipahami tanpa visual — " +
              "misalnya bentuk, warna, jumlah, atau posisi objek konkret. " +
              "Jangan buat gambar untuk penjelasan abstrak, definisi, atau aturan.",
            properties: {
              subject: {
                type: "string",
                description:
                  "The single concrete object to illustrate, in English. " +
                  "Must be ONE specific physical object or set of identical objects — not a scene, activity, or concept. " +
                  "No humans, faces, or cartoon characters. No abstract ideas. " +
                  "Good: 'five red apples', 'a blue triangle'. " +
                  "Bad: 'children learning', 'a classroom', 'the concept of addition'.",
              },
              scene: {
                type: "string",
                description:
                  "Complete description of the illustration in English, in one sentence. " +
                  "Must include: (1) the exact object from subject, (2) quantity if countable, (3) specific colors, (4) simple background. " +
                  "No humans, faces, body parts, or characters. No text, numbers, or letters in the image. " +
                  "Keep it simple — one main object, plain background. " +
                  "Good: 'five red apples arranged in a row on a white background'. " +
                  "Bad: 'a teacher showing apples to students in a colorful classroom'.",
              },
              safetyConstraints: {
                type: "string",
                description:
                  "Safety constraints for child-safe image. Leave empty string if none needed. " +
                  "Example: 'no sharp objects, no fire, no animals that may scare children'.",
              },
              altText: {
                type: "string",
                description:
                  "Screen reader description in Bahasa Indonesia, one to two sentences. " +
                  "Must mention the object, quantity, and color. " +
                  "Example: 'Lima apel merah tersusun berjajar di atas latar putih.'",
              },
            },
            required: [
              "subject",
              "scene",
              "safetyConstraints",
              "altText",
            ],
          },
        },
        required: [
          "title",
          "body",
          "audioScript",
          "interactions",
          "hasVisual",
          "visualSpec",
        ],
      },
    },
  },
  required: ["readingLevel", "adaptationNotes", "sections"],
};

/**
 * Memetakan keluaran AI ke `AdaptedContent` milik database.
 *
 * Id dibuat di sini: nomor indeks bagian dan nomor opsi. Aset visual selalu
 * `assetId: null` pada tahap ini karena filenya belum dibuat; yang direferensikan
 * hanyalah altText yang sudah disetujui AI (PRD Bab 10 Bab 3.2).
 */
export function keAdaptedContent(
  hasil: AdaptasiAi,
  targetId: string,
): AdaptedContent & { requests: PermintaanVisual[] } {
  const requests: PermintaanVisual[] = [];

  const sections: AdaptedSection[] = hasil.sections.map((bagian, sectionIndex) => {
    const media: AdaptedMedia[] = [];
    if (bagian.hasVisual && bagian.visualSpec) {
      media.push({ assetId: null, altText: bagian.visualSpec.altText.trim() });
      // Hanya pakai `scene` sebagai prompt — scene sudah mencakup subjek,
      // jumlah, warna, dan konteks lengkap. Menggabungkan subject + scene
      // menghasilkan duplikasi informasi yang membingungkan model diffusion.
      // subject disimpan di visualSpec untuk referensi/debug tapi tidak masuk prompt.
      const promptEn = bagian.visualSpec.scene.trim();
      requests.push({
        sectionIndex,
        promptEn,
        altText: bagian.visualSpec.altText.trim(),
      });
    }

    const interactions: AdaptedInteraction[] = bagian.interactions.map((interaksi) => ({
      kind: interaksi.kind,
      prompt: interaksi.prompt.trim(),
      options: interaksi.options.map((opsi, opsiIndex) => ({
        id: `opt-${sectionIndex}-${opsiIndex}`,
        label: opsi.label.trim(),
        correct: opsi.correct,
      })),
      acceptedAnswers: interaksi.acceptedAnswers
        .map((jawaban) => jawaban.trim().toLowerCase())
        .filter(Boolean),
    }));

    return {
      index: sectionIndex,
      title: bagian.title.trim(),
      body: bagian.body.map((baris) => baris.trim()).filter(Boolean),
      media,
      interactions,
      audioScript: bagian.audioScript.trim(),
    };
  });

  return {
    sections,
    readingLevel: hasil.readingLevel.trim(),
    generatedFor: targetId,
    requests,
  };
}

export type PermintaanVisual = {
  sectionIndex: number;
  /** Prompt Bahasa Inggris siap dikirim ke Pollinations. */
  promptEn: string;
  altText: string;
};
