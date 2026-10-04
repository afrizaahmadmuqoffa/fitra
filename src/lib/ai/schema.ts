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
  sectionsNeedingVisual: z
    .array(z.string().min(1).max(160))
    .max(24)
    .describe("Judul bagian yang benar-benar butuh ilustrasi"),
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
    sectionsNeedingVisual: {
      type: "array",
      description:
        "Judul sub-bagian yang perlu ilustrasi. Kosongkan bila seluruh materi bisa dijelaskan tanpa gambar.",
      items: { type: "string" },
    },
  },
  required: ["summary", "estimatedReadingLevel", "structure", "sectionsNeedingVisual"],
};

/** Memetakan keluaran AI ke bentuk `MaterialAnalysis` milik database. */
export function keAnalisis(hasil: AnalisisAi, judulCadangan: string): MaterialAnalysis {
  const struktur = hasil.structure.map((item) => ({
    title: item.title.trim() || judulCadangan,
    summary: item.summary.trim(),
    keyTerms: item.keyTerms.map((kata) => kata.trim()).filter(Boolean),
  }));

  const indeksButuhVisual = struktur
    .map((item, index) =>
      hasil.sectionsNeedingVisual.some((judul) =>
        judul.trim().toLowerCase() === item.title.trim().toLowerCase(),
      )
        ? index
        : -1,
    )
    .filter((index) => index >= 0);

  return {
    structure: struktur,
    estimatedReadingLevel: hasil.estimatedReadingLevel.trim(),
    visualSections: indeksButuhVisual,
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
  style: z.string().min(3).max(200),
  safetyConstraints: z.string().max(300),
  altText: z.string().min(8).max(300),
});

const zBagianAi = z.object({
  title: z.string().min(2).max(120),
  body: z.array(z.string().min(1).max(600)).min(1).max(8),
  audioScript: z.string().min(10).max(1500),
  interactions: z.array(zInteraksiAi).max(3),
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
              "Isi bagian sebagai kalimat terpisah. Panjang kalimat mengikuti tingkat bahasa siswa.",
            items: { type: "string" },
          },
          audioScript: {
            type: "string",
            description:
              "Naskah yang akan dibacakan dengan suara. Bentuknya narasi lisan yang mengalir, bukan daftar poin dan bukan kalimat dry yang harus dibaca. Tidak boleh berisi markdown, penanda, atau instruksi apa pun untuk pembaca layar.",
          },
          interactions: {
            type: "array",
            description:
              "Soal atau aktivitas singkat. Boleh kosong bila bagian ini tidak perlu soal.",
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
              "Detail ilustrasi jika hasVisual true, null jika tidak butuh gambar.",
            properties: {
              subject: {
                type: "string",
                description: "Obyek utama yang digambar, konkret dan tunggal.",
              },
              scene: {
                type: "string",
                description:
                  "Situasi lengkap yang memuat objek, jumlah, warna, dan latar belakang yang relevan.",
              },
              style: {
                type: "string",
                description:
                  "Gaya ilustrasi, misalnya ilustrasi buku anak SDLB dengan warna cerah dan bentuk sederhana.",
              },
              safetyConstraints: {
                type: "string",
                description:
                  "Batasan untuk gambar yang aman dilihat anak. Boleh kosong bila tidak ada.",
              },
              altText: {
                type: "string",
                description:
                  "Deskripsi gambar untuk pembaca layar, satu-dua kalimat, menyebut objek dan jumlah.",
              },
            },
            required: [
              "subject",
              "scene",
              "style",
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
      requests.push({
        sectionIndex,
        subject: bagian.visualSpec.subject.trim(),
        scene: bagian.visualSpec.scene.trim(),
        style: bagian.visualSpec.style.trim(),
        safetyConstraints: bagian.visualSpec.safetyConstraints.trim(),
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
  subject: string;
  scene: string;
  style: string;
  safetyConstraints: string;
  altText: string;
};
