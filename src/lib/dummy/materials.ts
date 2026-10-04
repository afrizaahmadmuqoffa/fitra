import type {
  AdaptedContent,
  Material,
  MaterialAdaptation,
  MaterialSection,
  VisualAsset,
} from "./types";
import { studentProfiles, students, teacher } from "./people";

const S = (
  title: string,
  summary: string,
  keyTerms: string[],
): MaterialSection => ({ title, summary, keyTerms });

export const materials: Material[] = [
  {
    id: "mat-angka",
    teacherId: teacher.id,
    classId: "cls-iv-b",
    title: "Mengenal Angka 1 sampai 10",
    subject: "Matematika",
    sourceType: "pdf",
    sourceFileName: "modul-angka-1-10.pdf",
    sourceText:
      "Angka dipakai untuk menghitung benda. Angka 1 berarti satu benda. Angka 2 berarti dua benda. Angka 3 berarti tiga benda. Kita menghitung apel di keranjang. Satu apel. Dua apel. Tiga apel. Empat apel. Lima apel. Kalau sudah sampai sepuluh, kita menghitung ulang dari satu. Angka dipakai untuk menunjukkan jumlah. Angka juga dipakai untuk nomor urut. Nomor urut dimulai dari satu. Modul ini membahas angka satu sampai sepuluh, cara menghitung benda, dan cara mengurutkan angka dari yang paling kecil.",
    status: "published",
    aiAnalysis: {
      summary:
        "Teks pendek tentang bilangan asli satu sampai sepuluh, hubungan jumlah dan angka, serta pengurutan bilangan.",
      estimatedReadingLevel: "Kelas 3",
      visualSections: [0, 2],
      structure: [
        S("Apa itu angka", "Pengertian angka sebagai alat menghitung jumlah benda.", [
          "angka",
          "jumlah",
          "benda",
        ]),
        S("Menghitung benda", "Latihan menghitung apel satu sampai lima di dalam keranjang.", [
          "menghitung",
          "keranjang",
          "apel",
        ]),
        S("Mengurutkan angka", "Mengurutkan angka dari yang paling kecil sampai paling besar.", [
          "urutan",
          "kecil",
          "besar",
        ]),
      ],
    },
    createdAt: "2026-02-02",
  },
  {
    id: "mat-tumbuhan",
    teacherId: teacher.id,
    classId: "cls-v-a",
    title: "Bagian-Bagian Tumbuhan",
    subject: "IPA",
    sourceType: "pdf",
    sourceFileName: "modul-bagian-tumbuhan.pdf",
    sourceText:
      "Tumbuhan tersusun dari beberapa bagian. Akar tumbuh di dalam tanah. Akar menyerap air dari tanah. Batang menghubungkan akar dengan daun. Batang menyokong daun agar tetap tegak. Daun membuat makanan dengan bantuan cahaya matahari. Bunga adalah bagian tumbuhan yang dapat membuat biji. Buah muncul dari bunga. Bijinya dapat tumbuh menjadi tunas kecil.",
    status: "published",
    aiAnalysis: {
      summary:
        "Pembagian utama tumbuhan menjadi akar, batang, daun, bunga, dan buah serta fungsi setiap bagian.",
      estimatedReadingLevel: "Kelas 4",
      visualSections: [0, 1, 3],
      structure: [
        S("Akar dan batang", "Fungsi akar menyerap air dan fungsi batang menyokong daun.", [
          "akar",
          "batang",
          "menyerap air",
        ]),
        S("Daun dan cahaya", "Peran daun membuat makanan dengan bantuan cahaya matahari.", [
          "daun",
          "cahaya matahari",
          "makanan",
        ]),
        S("Bunga dan buah", "Proses bunga menjadi buah dan biji menjadi tunas baru.", [
          "bunga",
          "buah",
          "biji",
        ]),
      ],
    },
    createdAt: "2026-02-04",
  },
  {
    id: "mat-anggota-keluarga",
    teacherId: teacher.id,
    classId: "cls-iv-b",
    title: "Mengenal Anggota Keluarga",
    subject: "Bahasa Indonesia",
    sourceType: "text",
    sourceFileName: "teks-anggota-keluarga.txt",
    sourceText:
      "Keluarga terdiri dari beberapa orang. Orang pertama adalah ayah. Orang kedua adalah ibu. Orang ketiga adalah kakak. Orang keempat adalah adik. Semua anggota keluarga tinggal bersama. Anak membantu orang tua di rumah. Kakak menjaga adik yang masih kecil. Ibu menyiapkan makanan. Ayah bekerja di luar rumah. Kita belajar menyapa anggota keluarga dengan sopan.",
    status: "published",
    aiAnalysis: {
      summary:
        "Enumerasi anggota keluarga beserta peran dan kegiatan harian masing-masing.",
      estimatedReadingLevel: "Kelas 2",
      visualSections: [0, 2],
      structure: [
        S("Ayah dan ibu", "Peran ayah bekerja dan ibu menyiapkan makanan di rumah.", [
          "ayah",
          "ibu",
          "rumah",
        ]),
        S("Kakak dan adik", "Kakak menjaga adik yang masih kecil.", ["kakak", "adik", "menjaga"]),
        S("Sapaan sopan", "Cara menyapa anggota keluarga dengan sopan dan ramah.", [
          "sapaan",
          "sopan",
          "ramah",
        ]),
      ],
    },
    createdAt: "2026-02-07",
  },
  {
    id: "mat-siklus-air",
    teacherId: teacher.id,
    classId: "cls-v-a",
    title: "Siklus Air Sederhana",
    subject: "IPA",
    sourceType: "docx",
    sourceFileName: "modul-siklus-air.docx",
    sourceText:
      "Air di permukaan bumi menguap ketika terkena panas matahari. Uap air naik ke udara dan membentuk awan. When udara menjadi dingin, uap air berubah menjadi titik-titik air kecil. Titik-titik air turun ke tanah sebagai hujan. Air hujan mengalir ke sungai dan kembali ke laut. Siklus air berlangsung terus-menerus. Air tidak pernah habis di bumi, hanya berpindah tempat.",
    status: "ai_ready",
    aiAnalysis: {
      summary:
        "Tahapan penguapan, pembentukan awan, pengembunan, dan hujan sebagai satu siklus yang berulang.",
      estimatedReadingLevel: "Kelas 5",
      visualSections: [0, 1],
      structure: [
        S("Air menguap", "Panas matahari membuat air di permukaan bumi menguap.", [
          "menguap",
          "panas matahari",
          "uap",
        ]),
        S("Awan dan hujan", "Uap air mengembun menjadi awan lalu turun sebagai hujan.", [
          "awan",
          "hujan",
          "dingin",
        ]),
        S("Kembali ke laut", "Hujan mengalir melalui sungai ke laut lalu menguap lagi.", [
          "sungai",
          "laut",
          "berulang",
        ]),
      ],
    },
    createdAt: "2026-02-11",
  },
  {
    id: "mat-belanja",
    teacherId: teacher.id,
    classId: "cls-iv-a",
    title: "Berbelanja di Pasar",
    subject: "Matematika",
    sourceType: "pdf",
    sourceFileName: "modul-belanja-pasar.pdf",
    sourceText:
      "Berbelanja dilakukan di pasar atau toko. Pembeli membeli kebutuhan sehari-hari. Barang yang dijual memiliki harga. Harga terlihat dari label barang. Pembeli membayar uang kepada penjual. Uang yang dibayarkan harus uang yang benar. Kembalian diberikan jika uang yang dibayarkan lebih besar dari harga barang. Pelanggan yang sopan mendapat pelayanan yang baik.",
    status: "ai_ready",
    aiAnalysis: {
      summary:
        "Proses belanja: memilih barang, memeriksa harga, membayar, dan menghitung kembalian.",
      estimatedReadingLevel: "Kelas 4",
      visualSections: [0, 2],
      structure: [
        S("Barang dan harga", "Mengenali barang kebutuhan harian dan label harganya.", [
          "barang",
          "harga",
          "pasar",
        ]),
        S("Bayar dan kembalian", "Menghitung kembalian dari uang yang dibayarkan.", [
          "bayar",
          "kembalian",
          "uang",
        ]),
        S("Pelanggan sopan", "Sikap sopan saat berinteraksi dengan penjual.", [
          "sopan",
          "pelayanan",
          "penjual",
        ]),
      ],
    },
    createdAt: "2026-02-14",
  },
  {
    id: "mat-warna",
    teacherId: teacher.id,
    classId: "cls-iv-b",
    title: "Mengenal Warna Utama",
    subject: "Bahasa Indonesia",
    sourceType: "text",
    sourceFileName: "teks-warna-utama.txt",
    sourceText:
      "Warna membuat dunia terlihat indah. Ada tiga warna utama. Warna merah, kuning, dan biru. Warna-warna ini dicampur untuk membuat warna baru. Merah dan kuning menghasilkan oranye. Biru dan kuning menghasilkan hijau. Merah dan biru menghasilkan ungu. Mengenal warna melatih mata dan ingatan anak.",
    status: "draft",
    aiAnalysis: null,
    createdAt: "2026-02-18",
  },
  {
    id: "mat-hewan",
    teacherId: teacher.id,
    classId: "cls-v-a",
    title: "Hewan Ternak dan KebutuhanNya",
    subject: "IPA",
    sourceType: "pdf",
    sourceFileName: "modul-hewan-ternak.pdf",
    sourceText:
      "Hewan ternak adalah hewan yang dipelihara manusia. Sapi menghasilkan susu. Ayam bertelur dan dagingnya dimakan. Kambing menghasilkan susu dan daging. Kuda digunakan untuk mengangkut beban. Hewan ternak membutuhkan makan, minum, dan tempat yang bersih.",
    status: "pending_ai",
    aiAnalysis: null,
    createdAt: "2026-02-20",
  },
];

type SectionSeed = {
  title: string;
  body: string[];
  altText: string;
  audioScript: string;
  question: string;
  options: { label: string; correct: boolean }[];
  needsVisual: boolean;
};

/** Ringkas: dipakai untuk siswa dengan academicLevel low. Utuh: untuk medium dan high. */
const seeds: Record<string, { ringkas: SectionSeed[]; utuh: SectionSeed[] }> = {
  "mat-angka": {
    ringkas: [
      {
        title: "Apa itu angka",
        body: ["Angka dipakai untuk menghitung benda.", "Satu benda berarti angka 1."],
        altText: "Satu keranjang berisi satu apel merah",
        audioScript:
          "Angka dipakai untuk menghitung benda. Satu benda berarti angka satu. Ingat ya, angka itu alat hitung.",
        question: "Berapa banyak apel di dalam keranjang?",
        options: [
          { label: "Satu", correct: true },
          { label: "Dua", correct: false },
          { label: "Lima", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Menghitung benda",
        body: ["Hitung apel satu per satu.", "Satu, dua, tiga, empat, lima."],
        altText: "Keranjang apel berisi lima buah apel tersusun berurutan",
        audioScript:
          "Sekarang kita menghitung apel satu per satu. Satu, dua, tiga, empat, lima. Ada lima apel.",
        question: "Mana jumlah yang benar?",
        options: [
          { label: "Tiga", correct: false },
          { label: "Lima", correct: true },
          { label: "Sepuluh", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Mengurutkan angka",
        body: ["Urutan dari yang paling kecil.", "Satu, dua, tiga, sampai sepuluh."],
        altText: "Kartu angka satu sampai sepuluh tersusun berurutan",
        audioScript:
          "Angka diurutkan dari yang paling kecil. Satu, dua, tiga, sampai sepuluh. Kalau habis, hitung lagi dari satu.",
        question: "Angka paling kecil adalah?",
        options: [
          { label: "Satu", correct: true },
          { label: "Lima", correct: false },
          { label: "Sepuluh", correct: false },
        ],
        needsVisual: false,
      },
    ],
    utuh: [
      {
        title: "Apa itu angka",
        body: [
          "Angka dipakai untuk menghitung jumlah benda.",
          "Satu benda berarti angka 1. Dua benda berarti angka 2.",
          "Angka juga dipakai untuk nomor urut.",
        ],
        altText: "Satu keranjang berisi satu apel merah di atas meja kayu",
        audioScript:
          "Angka dipakai untuk menghitung jumlah benda. Satu benda berarti angka satu. Dua benda berarti angka dua. Angka juga dipakai untuk nomor urut.",
        question: "Apa fungsi angka dalam pelajaran ini?",
        options: [
          { label: "Menghitung jumlah benda", correct: true },
          { label: "Menggambar benda", correct: false },
          { label: "Menulis nama benda", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Menghitung benda",
        body: [
          "Hitung apel di dalam keranjang satu per satu.",
          "Satu, dua, tiga, empat, lima.",
          "Kalau sudah sampai sepuluh, hitung ulang dari satu.",
        ],
        altText: "Keranjang berisi lima buah apel tersusun berurutan dari kiri ke kanan",
        audioScript:
          "Sekarang kita menghitung apel satu per satu. Satu, dua, tiga, empat, lima. Kalau sudah sampai sepuluh, kita menghitung ulang dari satu.",
        question: "Berapa jumlah apel di dalam keranjang?",
        options: [
          { label: "Empat", correct: false },
          { label: "Lima", correct: true },
          { label: "Sepuluh", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Mengurutkan angka",
        body: [
          "Urutkan angka dari yang paling kecil.",
          "Satu, dua, tiga, empat, lima, lalu seterusnya sampai sepuluh.",
          "Angka yang paling besar dari satu sampai sepuluh adalah 10.",
        ],
        altText: "Sepuluh kartu angka tersusun berurutan dengan angka satu di kiri",
        audioScript:
          "Kita mengurutkan angka dari yang paling kecil. Satu, dua, tiga, empat, lima, sampai sepuluh. Angka paling besar adalah sepuluh.",
        question: "Manakah urutan yang benar?",
        options: [
          { label: "10, 9, 8, 7", correct: false },
          { label: "1, 2, 3, 4", correct: true },
          { label: "5, 4, 3, 2", correct: false },
        ],
        needsVisual: false,
      },
    ],
  },
  "mat-tumbuhan": {
    ringkas: [
      {
        title: "Akar dan batang",
        body: ["Akar ada di dalam tanah.", "Akar menyerap air."],
        altText: "Bagian bawah tumbuhan dengan akar bercabang di dalam tanah",
        audioScript: "Akar ada di dalam tanah. Fungsi akar menyerap air dari tanah.",
        question: "Di mana letak akar?",
        options: [
          { label: "Di dalam tanah", correct: true },
          { label: "Di atas tanah", correct: false },
          { label: "Di daun", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Daun dan cahaya",
        body: ["Daun kerjaannya membuat makanan.", "Daun butuh cahaya matahari."],
        altText: "Daun hijau lebar dengan tetesan air di permukaannya",
        audioScript:
          "Daun bekerja membuat makanan untuk tumbuhan. Daun membutuhkan cahaya matahari untuk bekerja.",
        question: "Apa yang dibutuhkan daun?",
        options: [
          { label: "Cahaya matahari", correct: true },
          { label: "Gelap", correct: false },
          { label: "Batu", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Bunga dan buah",
        body: ["Bunga bisa jadi buah.", "Biji di dalam buah bisa jadi tunas."],
        altText: "Bunga merah yang sedang_mekar diserbukici oleh duacebvbfgd lebah",
        audioScript:
          "Bunga bisa berubah menjadi buah. Biji di dalam buah bisa tumbuh menjadi tunas kecil.",
        question: "Biji bisa tumbuh menjadi?",
        options: [
          { label: "Tunas kecil", correct: true },
          { label: "Batu", correct: false },
          { label: "Angin", correct: false },
        ],
        needsVisual: true,
      },
    ],
    utuh: [
      {
        title: "Akar dan batang",
        body: [
          "Akar tumbuh di dalam tanah.",
          "Akar menyerap air dari tanah dan zat makanan mineral yang ada di dalamnya.",
          "Batang menghubungkan akar dengan daun.",
        ],
        altText: "Tanaman lengkap dengan akar bercabang, batang tegak, dan daun lebar",
        audioScript:
          "Akar tumbuh di dalam tanah. Akar menyerap air dari tanah. Batang menghubungkan akar dengan daun.",
        question: "Fungsi batang tumbuhan adalah?",
        options: [
          { label: "Menyerap air", correct: false },
          { label: "Menghubungkan akar dan daun", correct: true },
          { label: "Membuat bunga", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Daun dan cahaya",
        body: [
          "Daun membuat makanan dengan bantuan cahaya matahari.",
          "Warna hijau pada daun berasal dari klorofil yang ada di dalam daun.",
        ],
        altText: "Daun hijau lebar dengan tetesan air di permukaannya",
        audioScript:
          "Daun membuat makanan dengan bantuan cahaya matahari. Warna hijau pada daun berasal dari klorofil.",
        question: "Daun membuat makanan dengan bantuan apa?",
        options: [
          { label: "Cahaya matahari", correct: true },
          { label: "Air tanah", correct: false },
          { label: "Batang", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Bunga dan buah",
        body: [
          "Bunga adalah bagian tumbuhan yang dapat membuat biji.",
          "Buah muncul dari bunga yang sudah selesai mekar.",
          "Bijinya dapat tumbuh menjadi tunas kecil.",
        ],
        altText: "Bunga merah mekar di dekat buah yang masih muda",
        audioScript:
          "Bunga dapat membuat biji. Buah muncul dari bunga. Bijinya dapat tumbuh menjadi tunas kecil.",
        question: "Buah muncul dari bagian tumbuhan yang mana?",
        options: [
          { label: "Akar", correct: false },
          { label: "Bunga", correct: true },
          { label: "Batu", correct: false },
        ],
        needsVisual: true,
      },
    ],
  },
  "mat-anggota-keluarga": {
    ringkas: [
      {
        title: "Ayah dan ibu",
        body: ["Ayah bekerja di luar rumah.", "Ibu menyiapkan makanan."],
        altText: "Ayah dan ibu bersama anak di depan rumah",
        audioScript:
          "Ayah bekerja di luar rumah. Ibu menyiapkan makanan di dapur. Kamu tahu, ya?",
        question: "Siapa yang menyiapkan makanan?",
        options: [
          { label: "Ibu", correct: true },
          { label: "Ayah", correct: false },
          { label: "Kakak", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Kakak dan adik",
        body: ["Kakak menjaga adik.", "Adik masih kecil."],
        altText: "Kakak dan adik duduk berdua di atas tikar",
        audioScript: "Kakak menjaga adik yang masih kecil. Adik tidak boleh sendirian.",
        question: "Siapa yang menjaga adik?",
        options: [
          { label: "Kakak", correct: true },
          { label: "Ibu", correct: false },
          { label: "Ayah", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Sapa dengan ramah",
        body: ["Sapa orang lain dengan ramah.", "Sebut namanya lebih dulu."],
        altText: "Seorang anak memberi salam kepada gurunya di ruang kelas",
        audioScript:
          "Sapa orang lain dengan ramah. Sebut namanya lebih dulu. Halo, Bu Guru. Halo, Ibu.",
        question: "Bagaimana cara menyapa yang baik?",
        options: [
          { label: "Dengan ramah", correct: true },
          { label: "Dengan suara keras", correct: false },
          { label: "Tanpa memberi salam", correct: false },
        ],
        needsVisual: false,
      },
    ],
    utuh: [
      {
        title: "Anggota keluarga",
        body: [
          "Keluarga terdiri dari beberapa orang.",
          "Orang pertama adalah ayah. Orang kedua adalah ibu.",
          "Ibu menyiapkan makanan setiap hari.",
        ],
        altText: "Keluarga duduk bersama di ruang tamu pada sore hari",
        audioScript:
          "Keluarga terdiri dari beberapa orang. Orang pertama adalah ayah. Orang kedua adalah ibu. Ibu menyiapkan makanan setiap hari.",
        question: "Siapa yang menyiapkan makanan setiap hari?",
        options: [
          { label: "Ibu", correct: true },
          { label: "Ayah", correct: false },
          { label: "Adik", correct: false },
        ],
        needsVisual: true,
      },
      {
        title: "Peran kakak dan adik",
        body: [
          "Kakak menjaga adik yang masih kecil.",
          "Anak membantu orang tua di rumah.",
          "Semua anggota keluarga tinggal bersama.",
        ],
        altText: "Kakak membantu adik menyimpan sepatu ke dalam rak",
        audioScript:
          "Kakak menjaga adik yang masih kecil. Anak membantu orang tua di rumah. Semua anggota keluarga tinggal bersama.",
        question: "Kakak membantu dengan cara?",
        options: [
          { label: "Menjaga adik", correct: true },
          { label: "Memasak sendiri", correct: false },
          { label: "Pulang paling akhir", correct: false },
        ],
        needsVisual: false,
      },
      {
        title: "Sapaan sopan",
        body: [
          "Kita menyapa anggota keluarga dengan sopan.",
          "Sapaan baik: halo, selamat pagi, terima kasih.",
          "Sapaan sopan membuat orang lain senang.",
        ],
        altText: "Anak tersenyum memberi salam kepada neneknya",
        audioScript:
          "Kita menyapa anggota keluarga dengan sopan. Sapaan baik adalah halo, selamat pagi, dan terima kasih. Sapaan sopan membuat orang lain senang.",
        question: "Sapaan mana yang sopan?",
        options: [
          { label: "Halo, terima kasih", correct: true },
          { label: "Diam saja", correct: false },
          { label: "Bicara tanpa sopan", correct: false },
        ],
        needsVisual: true,
      },
    ],
  },
};

export function buildAdaptedContent(
  materialId: string,
  studentId: string,
): AdaptedContent {
  const profile = studentProfiles.find((p) => p.studentId === studentId);
  const level = profile?.academicLevel ?? "medium";
  const set = seeds[materialId];
  if (!set) return { sections: [], readingLevel: level, generatedFor: studentId };
  const chosen = level === "low" ? set.ringkas : set.utuh;

  return {
    readingLevel: level === "low" ? "Sangat sederhana" : "Sederhana",
    generatedFor: studentId,
    sections: chosen.map((seed, index) => ({
      index,
      title: seed.title,
      body: seed.body,
      media: seed.needsVisual
        ? [
            {
              assetId: `ast-${materialId.replace("mat-", "")}-${studentId.replace("stu-", "")}-${index}`,
              altText: seed.altText,
            },
          ]
        : [],
      interactions: [
        {
          kind:
            profile?.interactionModes.speech && !profile?.interactionModes.touch
              ? "speech"
              : "tap",
          prompt: seed.question,
          options: seed.options.map((opt, i) => ({
            id: `opt-${index}-${i}`,
            label: opt.label,
            correct: opt.correct,
          })),
          acceptedAnswers: seed.options
            .filter((o) => o.correct)
            .map((o) => o.label.toLowerCase()),
        },
      ],
      audioScript: seed.audioScript,
    })),
  };
}

const now = "2026-02-21T08:15:00+07:00";

export const adaptations: MaterialAdaptation[] = students.flatMap((student) => {
  const classTargets: { materialId: string; status: "approved" | "draft" | "generating" }[] =
    student.id === "stu-sinta" || student.id === "stu-dimas"
      ? [
          { materialId: "mat-angka", status: "approved" },
          { materialId: "mat-tumbuhan", status: "approved" },
          { materialId: "mat-siklus-air", status: "draft" },
        ]
      : [
          { materialId: "mat-angka", status: "approved" },
          { materialId: "mat-anggota-keluarga", status: "approved" },
          { materialId: "mat-tumbuhan", status: "draft" },
        ];

  return classTargets.map((target) => {
    const hasSeeds = Boolean(seeds[target.materialId]);
    const id = `ada-${target.materialId.replace("mat-", "")}-${student.id.replace("stu-", "")}`;
    return {
      id,
      materialId: target.materialId,
      studentId: student.id,
      version: 1,
      status: hasSeeds ? target.status : "generating",
      adaptedContent: buildAdaptedContent(target.materialId, student.id),
      aiModel: "gemini-3.8-flash",
      aiPromptSnapshot:
        `material_id=${target.materialId}; profile_snapshot={"academicLevel":"${studentProfiles.find((p) => p.studentId === student.id)?.academicLevel}","interactionModes":"${Object.entries(studentProfiles.find((p) => p.studentId === student.id)?.interactionModes ?? {})
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join("+")}"}`,
      teacherEdits:
        target.status === "approved" && student.id === "stu-aisyah"
          ? [{ at: "2026-02-20T09:02:00+07:00", note: "Kalimat bagian 2 diganti kata yang lebih pendek.", sectionIndex: 1 }]
          : [],
      approvedAt: target.status === "approved" ? now : null,
      createdAt: "2026-02-19T10:00:00+07:00",
    } satisfies MaterialAdaptation;
  });
});

export const visualAssets: VisualAsset[] = adaptations
  .filter((a) => a.adaptedContent.sections.length > 0)
  .flatMap((adaptation) =>
    adaptation.adaptedContent.sections
      .filter((s) => s.media.length > 0)
      .map((section) => {
        const isGenerating = adaptation.status === "generating";
        const isFailed = adaptation.studentId === "stu-fajar" && section.index === 2;
        return {
          id: `ast-${adaptation.materialId.replace("mat-", "")}-${adaptation.studentId.replace("stu-", "")}-${section.index}`,
          materialAdaptationId: adaptation.id,
          sectionIndex: section.index,
          prompt: `Ilustrasi edukatif gaya flat untuk siswa SDLB: ${section.media[0].altText}`,
          model: "flux",
          altText: section.media[0].altText,
          status: isGenerating ? "generating" : isFailed ? "failed" : "ready",
          imageUrl: isGenerating || isFailed
            ? null
            : `https://picsum.photos/seed/fitra-visual-${adaptation.materialId.replace("mat-", "")}-${adaptation.studentId.replace("stu-", "")}-${section.index}/800/520`,
          createdAt: "2026-02-19T10:01:00+07:00",
        } satisfies VisualAsset;
      }),
  );

export { teacher, students, studentProfiles };
