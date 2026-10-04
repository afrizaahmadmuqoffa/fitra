/**
 * Prompt AI untuk analisis dan adaptasi materi.
 *
 * Prinsip yang dipegang modul ini:
 * - Prompt ditulis sebagai instruksi kerja untuk guru SLB berpengalaman,
 *   bukan sekadar "ringkas teks ini".
 * - Privasi dijaga sejak prompt disusun. Yang dikirim hanya snapshot profil
 *   pembelajaran. Nama, kelas, sekolah, usia, jenis kelamin, foto, dan
 *   catatan bebas guru tidak pernah masuk ke model (PRD Task 3.1).
 * - Nama field kontrak tidak ditulis dalam huruf campur di dalam string
 *   prompt. Nama aslinya sudah ada di JSON Schema yang dikirim bersamaan,
 *   jadi cukup sebut arti field-nya dengan bahasa Indonesia.
 */
import type {
  DisabilityType,
  MaterialAnalysis,
  SkillLevel,
  StudentProfile,
} from "@/db/types";

// =========================================================
// SNAPSHOT PROFIL
// =========================================================

/**
 * Bentuk profil yang dikirim ke model.
 *
 * Sengaja tidak memuat nama, nama panggilan, kelas, sekolah, usia, jenis
 * kelamin, foto, dan catatan bebas guru. Semua itu tidak diperlukan untuk
 * menulis materi dan merupakan data pribadi (PRD Task 3.1).
 */
export type SnapshotProfil = {
  tingkatAkademik: SkillLevel;
  membaca: SkillLevel;
  menulis: SkillLevel;
  berhitung: SkillLevel;
  sosialEmosional: {
    mengenaliOrang: SkillLevel;
    bekerjaSama: SkillLevel;
    mengaturEmosi: SkillLevel;
  };
  motorik: {
    halus: SkillLevel;
    kasar: SkillLevel;
  };
  kemandirian: {
    berpakaian: SkillLevel;
    makan: SkillLevel;
    menggunakanAlat: SkillLevel;
  };
  preferensiBelajar: string[];
  modeInteraksi: string[];
  tokenAntarmuka: {
    ukuranTeks: SkillLevel;
    kontrasTinggi: boolean;
    audioAktif: boolean;
    kecepatanAudio: string;
    gayaNavigasi: string;
  };
  /** Kategori hambatan, dipakai karena menentukan dukungan esensial. */
  jenisHambatan: DisabilityType;
};

function labelLevel(level: SkillLevel | undefined): string {
  if (level === "low") return "rendah";
  if (level === "high") return "tinggi";
  return "sedang";
}

/** Terjemahkan profil siswa menjadi bentuk minimal untuk dikirim ke model. */
export function keSnapshotProfil(
  profil: StudentProfile,
  jenisHambatan: DisabilityType,
): SnapshotProfil {
  const preferensi: string[] = [];
  if (profil.learningPreferences.visual) preferensi.push("gambar");
  if (profil.learningPreferences.audio) preferensi.push("suara");
  if (profil.learningPreferences.kinestetik) preferensi.push("gerakan");

  const mode: string[] = [];
  if (profil.interactionModes.touch) mode.push("tekan pilihan");
  if (profil.interactionModes.speech) mode.push("jawab dengan suara");
  if (profil.interactionModes.keyboard) mode.push("ketik jawaban");
  if (profil.interactionModes.switch) mode.push("sakelar tunggal");
  if (profil.interactionModes.drag) mode.push("seret gambar");

  return {
    tingkatAkademik: profil.academicLevel,
    membaca: profil.academicDetails.membaca,
    menulis: profil.academicDetails.menulis,
    berhitung: profil.academicDetails.berhitung,
    sosialEmosional: {
      mengenaliOrang: profil.socialEmotional.mengenaliOrang,
      bekerjaSama: profil.socialEmotional.bekerjaSama,
      mengaturEmosi: profil.socialEmotional.mengaturEmosi,
    },
    motorik: {
      halus: profil.motorSkills.motorHalus,
      kasar: profil.motorSkills.motorKasar,
    },
    kemandirian: {
      berpakaian: profil.independence.dressed,
      makan: profil.independence.makan,
      menggunakanAlat: profil.independence.menggunakanAlat,
    },
    preferensiBelajar: preferensi.length > 0 ? preferensi : ["gambar"],
    modeInteraksi: mode.length > 0 ? mode : ["tekan pilihan"],
    tokenAntarmuka: {
      ukuranTeks: profil.uiTokens.fontSize,
      kontrasTinggi: profil.uiTokens.contrastMode === "high",
      audioAktif: profil.uiTokens.audioEnabled,
      kecepatanAudio: profil.uiTokens.audioSpeed,
      gayaNavigasi: profil.uiTokens.navStyle,
    },
    jenisHambatan,
  };
}

/** Ringkasan profil dalam kalimat, untuk dibaca model. */
export function ringkasProfil(profil: SnapshotProfil): string {
  const sosial = [
    `mengenali orang ${profil.sosialEmosional.mengenaliOrang}`,
    `bekerja sama ${profil.sosialEmosional.bekerjaSama}`,
    `mengatur emosi ${profil.sosialEmosional.mengaturEmosi}`,
  ].join(", ");
  const motor = [
    `motorik halus ${profil.motorik.halus}`,
    `motorik kasar ${profil.motorik.kasar}`,
  ].join(", ");
  const mandiri = [
    `berpakaian ${profil.kemandirian.berpakaian}`,
    `makan ${profil.kemandirian.makan}`,
    `memakai alat ${profil.kemandirian.menggunakanAlat}`,
  ].join(", ");

  return [
    `tingkat akademik ${profil.tingkatAkademik}`,
    `membaca ${profil.membaca}, menulis ${profil.menulis}, berhitung ${profil.berhitung}`,
    sosial,
    motor,
    mandiri,
    `preferensi belajar ${profil.preferensiBelajar.join(", ")}`,
    `cara menjawab yang tersedia ${profil.modeInteraksi.join(", ")}`,
    `ukuran teks ${profil.tokenAntarmuka.ukuranTeks}`,
    `kontras tinggi ${profil.tokenAntarmuka.kontrasTinggi ? "ya" : "tidak"}`,
    `audio aktif ${profil.tokenAntarmuka.audioAktif ? "ya" : "tidak"}`,
    `kecepatan audio ${profil.tokenAntarmuka.kecepatanAudio}`,
    `gaya navigasi ${profil.tokenAntarmuka.gayaNavigasi}`,
    `kesulitan membaca kalimat panjang, setara kemampuan menulis ${labelLevel(profil.menulis)}`,
  ].join("; ");
}

// =========================================================
// ATURAN BAHASA
// =========================================================

/** Batas panjang kalimat per tingkat akademik. */
export const BATAS_KATA_KALIMAT: Record<SkillLevel, number> = {
  low: 8,
  medium: 14,
  high: 22,
};

function aturanBahasa(level: SkillLevel): string {
  if (level === "low") {
    return [
      "- Tiap kalimat maksimal 8 kata.",
      "- Tiap kalimat hanya satu klausa.",
      "- Jangan memakai kata penghubung seperti karena, sehingga, tetapi, atau lalu.",
      "- Pakai kata benda konkret dan kata kerja sederhana.",
      "- Kalau ada dua ide, pecah jadi dua kalimat.",
    ].join("\n");
  }
  if (level === "high") {
    return [
      "- Tiap kalimat maksimal 22 kata.",
      "- Boleh memakai satu klausa anak untuk menunjukkan hubungan sebab-akibat.",
      "- Tetap pakai kata yang lazim dipakai anak usia sekolah.",
      "- Hindari istilah teknis tanpa penjelasan.",
    ].join("\n");
  }
  return [
    "- Tiap kalimat maksimal 14 kata.",
    "- Tiap kalimat boleh satu klausa anak sebagai penjelasan tambahan.",
    "- Pakai kosakata sehari-hari.",
    "- Hindari istilah teknis tanpa penjelasan.",
  ].join("\n");
}

/**
 * Aturan tambahan per jenis hambatan.
 *
 * Ini bagian yang paling menentukan. Anak dengan kebutuhan berbeda
 * membutuhkan dukungan berbeda, bukan sekadar kalimat yang lebih pendek.
 */
const ATURAN_HAMBATAN: Record<DisabilityType, string[]> = {
  tunanetra: [
    "- Anak tidak dapat melihat gambar, jadi keterangan visual wajib ditulis lengkap di teks.",
    "- Jangan menulis kalimat seperti pada gambar atau lihat warna di atas.",
    "- Tulis informasi visual langsung di dalam kalimat.",
    "- Alt text wajib menyebut jumlah, warna, dan posisi objek.",
    "- Naskah audio menjadi jalur informasi utama dan harus berdiri sendiri.",
  ],
  tunarungu: [
    "- Visual adalah jalur utama. Anak tidak dapat mendengar audio sama sekali.",
    "- Semua informasi wajib ditulis di teks, jangan hanya di audio.",
    "- Pakai kalimat pendek dan tanda baca yang jelas.",
    "- Sertakan gambar atau ilustrasi untuk setiap konsep penting.",
    "- Jangan bergantung pada audio untuk menyampaikan informasi apapun.",
    "- Ulangi kata kunci penting di teks tertulis, bukan hanya di naskah audio.",
  ],
  tunagrahita: [
    "- Pakai contoh konkret dan angka nyata, bukan definisi.",
    "- Pecah pekerjaan menjadi urutan satu per satu.",
    "- Ulangi konsep utama di bagian berbeda.",
    "- Hindari kalimat yang menuntut penalaran lebih dari satu langkah.",
  ],
  tunadaksa: [
    "- Pilihan jawaban dibuat pendek dan sering disertai gambar.",
    "- Utamakan menekan pilihan besar, jangan menyeret.",
    "- Satu instruksi per baris supaya mudah dibaca sekilas.",
  ],
  autis: [
    "- Pakai bahasa yang harfiah, hindari kiasan dan lelucon.",
    "- Jangan menulis aku atau kalian. Pakai kamu.",
    "- Beri satu instruksi per kalimat.",
    "- Sebutkan urutan secara terbuka: pertama, lalu, terakhir.",
    "- Jangan memberi instruksi yang bergantung pada keadaan di luar layar.",
  ],
  tunawicara: [
    "- Tawarkan beberapa cara menjawab yang setara.",
    "- Jangan mengasumsikan anak dapat melafalkan kata tertentu.",
    "- Jawaban tetap harus bisa diberikan dengan menekan pilihan.",
  ],
  tunalaras: [
    "- Pakai nada tenang dan susunan yang rapi.",
    "- Beri urutan yang jelas dan bisa diprediksi.",
    "- Hindari kalimat yang menantang atau membandingkan antar anak.",
  ],
  tunaganda: [
    "- Jelaskan simbol dan warna dengan kata yang jelas.",
    "- Hindari penyamaan yang terlalu jauh.",
    "- Beri contoh berulang untuk setiap simbol.",
  ],
  lainnya: [
    "- Pakai bahasa sederhana dan susunan yang jelas.",
    "- Beri contoh konkret.",
  ],
};

// =========================================================
// SISTEM: ANALISIS
// =========================================================

export const SISTEM_ANALISIS = [
  "Kamu adalah perancang pembelajaran berpengalaman yang bekerja sama dengan guru sekolah luar biasa.",
  "Tugasmu membedah materi pelajaran menjadi struktur yang bisa dipakai sebagai bahan dasar penyusunan materi adaptif.",
  "",
  "Aturan kerja:",
  "1. Jangan menambah fakta, angka, nama, atau tanggal yang tidak ada di materi sumber.",
  "2. Jangan ikut memberi nilai moral. Tugasmu hanya membedah struktur.",
  "3. Pecah materi sesuai alur belajar, bukan sesuai paragraf aslinya.",
  "4. Tulis semua keluaran dalam bahasa Indonesia yang baku dan mudah dipahami guru.",
  "5. Kunci jawaban dan butir soal yang sudah ada di materi sumber harus dipertahankan apa adanya.",
  "6. Keluarkan hanya JSON yang sesuai skema, tanpa teks tambahan dan tanpa blok kode.",
].join("\n");

export function bangunPromptAnalisis(input: {
  judul: string;
  mapel: string;
  teks: string;
}): string {
  return [
    "Uraikan struktur materi pelajaran berikut.",
    "",
    `Judul materi: ${input.judul}`,
    `Mata pelajaran: ${input.mapel}`,
    "",
    "Materi sumber:",
    "<<<",
    input.teks,
    ">>>",
    "",
    "Isi setiap medan:",
    "1. Ringkasan keseluruhan materi dalam 1 sampai 3 kalimat.",
    "2. Tingkat keterbacaan materi sumber. Pilih satu dari: Sangat sederhana, Sederhana, Sedang, Kompleks.",
    "3. Daftar sub-bagian materi. Tiap sub-bagian berisi judul, ringkasan, dan daftar konsep kunci.",
    "4. Indeks sub-bagian yang mungkin butuh ilustrasi (hint untuk adaptasi, bukan keputusan final).",
    "",
    "TENTANG HINT GAMBAR:",
    "- Masukkan indeks bagian (0, 1, 2, ...) jika gambar kemungkinan menambah pemahaman.",
    "- Materi penjelasan, definisi, atau aturan biasanya tidak butuh gambar.",
    "- Perkara seperti jumlah, warna, bentuk, atau posisi benda mungkin butuh gambar.",
    "- Kalau seluruh materi bisa dijelaskan dengan kata-kata saja, kirim daftar kosong.",
    "- Adaptasi AI akan memutuskan final berdasarkan profil siswa (tunanetra vs tunarungu beda kebutuhan visual).",
  ].join("\n");
}

// =========================================================
// SISTEM: ADAPTASI
// =========================================================

export const SISTEM_ADAPTASI = [
  "Kamu adalah perancang pembelajaran berpengalaman yang bekerja dengan guru sekolah luar biasa.",
  "",
  "Tugasmu menulis satu versi materi yang disesuaikan untuk satu anak sekolah luar biasa.",
  "Menyesuaikan berarti mengubah cara penyajian, urutan, panjang kalimat, dukungan visual, dan cara menjawab, agar anak dapat belajar dengan kemampuannya sendiri.",
  "",
  "ATURAN PALING PENTING:",
  "1. Jangan mengarang fakta. Materi sumber adalah satu-satunya sumber kebenaran.",
  "2. Jangan menambah angka, nama, tempat, atau tanggal yang tidak ada di materi sumber.",
  "3. Jangan menambah nilai moral, ajakan, atau pertanyaan pemandu nilai yang tidak ada di materi sumber.",
  "4. Semua hasil kerja kamu berstatus draf dan akan ditinjau guru sebelum dipakai.",
  "5. Jangan menulis seperti hasil sudah disetujui.",
  "6. Bila materi sumber kurang jelas di suatu titik, tahan dengan kalimat umum. Jangan mengarang detail.",
  "",
  "ATURAN BAHASA:",
  "- Tulis seluruh isi dalam bahasa Indonesia yang hangat, lugas, dan mudah dibaca.",
  "- Sapa anak dengan kata kamu, bukan aku atau kalian.",
  "- Jangan memakai istilah teknis tanpa penjelasan sederhana.",
  "- Jangan memakai markdown, penanda daftar, atau simbol bintang pada isi bagian, naskah audio, maupun pertanyaan.",
  "",
  "ATURAN SUSUNAN:",
  "- Satu bagian hanya satu konsep.",
  "- Ikuti urutan belajar dari materi sumber.",
  "- Judul bagian maksimal 6 kata dan tidak diakhiri titik.",
  "- Isi bagian berisi 2 sampai 4 kalimat sebagai penjelasan lengkap.",
  "- Setiap bagian wajib punya naskah audio.",
  "",
  "ATURAN NASKAH AUDIO:",
  "- Naskah audio akan dibacakan dengan suara ke anak.",
  "- Bentuknya seperti guru berbicara, bukan daftar poin dan bukan kalimat yang harus dibaca sendiri.",
  "- Dilarang memakai markdown, penanda daftar, tanda pengurut, angka berbentuk digit, dan keterangan adegan.",
  "- Tulis angka dalam bentuk kata supaya terdengar wajar. Contoh: satu dua tiga empat, bukan 1, 2, 3, 4.",
  "- Sebut ulang kata kunci di akhir kalimat.",
  "- Kalimat harus berdiri sendiri tanpa perlu melihat teks di layar.",
  "",
  "ATURAN AKTIVITAS:",
  "- Prompt aktivitas berupa satu kalimat yang langsung menyatakan kebutuhan anak.",
  "- Prompt jangan pernah membocorkan jawaban benar.",
  "- Untuk aktivitas tekan pilihan dan jawab dengan suara: isi 2 sampai 4 pilihan dan tepat satu pilihan benar.",
  "- Buat pilihan jawaban yang jelas berbeda satu sama lain.",
  "- Daftar jawaban yang diterima wajib memuat semua bentuk yang harus dianggap benar.",
  "  a. Bentuk kata dan bentuk angka bila jawabannya berupa angka. Jawaban benar lima harus menerima lima dan 5.",
  "  b. Varyasi kata yang biasa diucapkan anak, termasuk bentuk yang lebih singkat.",
  "  c. Jawaban benar yang ditulis lebih panjang atau lebih pendek.",
  "  d. Semua huruf kecil tanpa tanda baca di ujung.",
  "- Untuk aktivitas ketik, daftar jawaban yang diterima berisi kalimat pendek dan boleh lebih dari satu.",
  "- Minimal dua butir jawaban diterima untuk setiap aktivitas ber jawaban singkat.",
  "",
  "ATURAN AKTIVITAS SERET:",
  "- Gunakan kind drag untuk aktivitas menyusun urutan.",
  "- Cocok untuk: urutan angka, urutan langkah, urutan waktu, urutan sebab-akibat.",
  "- Jangan gunakan untuk memilih jawaban benar dari pilihan (gunakan tap untuk itu).",
  "- Minimal 3 pilihan, maksimal 6 pilihan.",
  "- Tandai semua pilihan dengan correct true sesuai urutan yang benar.",
  "- Prompt harus menjelaskan bahwa anak harus menyusun urutan.",
  "",
  "ATURAN GAMBAR:",
  "- Ajukan permintaan gambar hanya untuk bagian yang benar-benar tidak bisa dipahami tanpa gambar.",
  "- Materi penjelasan, definisi, aturan, dan perumpamaan tidak butuh gambar.",
  "- Boleh kosong. Lebih baik kosong daripada gambar yang tidak membantu.",
  "- Alt text wajib menjelaskan objek, jumlah, dan warna dalam satu sampai dua kalimat.",
  "- Obyek utama harus satu dan konkret, bukan gabungan beberapa obyek.",
  "- Situasi wajib lengkap dengan jumlah dan warna bila itu bagian dari materi.",
  "- Batasan keselamatan wajib menyebut larangan gambar yang tidak aman untuk anak.",
  "- Jangan meminta gambar yang berisi tulisan, angka, atau huruf.",
  "",
  "FORMAT KELUARAN:",
  "Keluarkan hanya JSON yang sesuai skema. Tanpa penjelasan tambahan.",
].join("\n");

/** Bagian profil yang dikirim ke model. */
function blokProfil(profil: SnapshotProfil): string {
  return [
    "SNAPSHOT PROFIL BELAJAR ANAK (tanpa data identitas):",
    ringkasProfil(profil),
    "",
    "ATURAN TAMBAHAN UNTUK JENIS HAMBATAN INI:",
    ...ATURAN_HAMBATAN[profil.jenisHambatan],
  ].join("\n");
}

/**
 * Membangun prompt adaptasi.
 *
 * Data materi dikirim utuh. Snapshot profil dikirim dalam bentuk ringkas
 * tanpa identitas, sesuai PRD Task 3.1.
 */
export function bangunPromptAdaptasi(input: {
  judul: string;
  mapel: string;
  teks: string;
  analisis: MaterialAnalysis | null;
  profil: SnapshotProfil;
}): string {
  const batas = BATAS_KATA_KALIMAT[input.profil.tingkatAkademik];

  const bagianDenganHintVisual =
    input.analisis?.structure.map((bagian, idx) => {
      const butuhGambar = input.analisis!.visualSections.includes(idx);
      return (
        `${idx + 1}. ${bagian.title} - ${bagian.summary}` +
        (bagian.keyTerms.length > 0
          ? ` Konsep kunci: ${bagian.keyTerms.join(", ")}.`
          : "") +
        (butuhGambar ? " [Bagian ini mungkin butuh gambar, pertimbangkan profil anak]" : "")
      );
    }) ?? [];

  return [
    "Tulis satu versi materi yang disesuaikan untuk satu anak berdasarkan materi sumber di bawah.",
    "",
    `Judul materi: ${input.judul}`,
    `Mata pelajaran: ${input.mapel}`,
    `Batas panjang kalimat untuk anak ini: ${batas} kata per kalimat.`,
    "",
    blokProfil(input.profil),
    "",
    "KESULITAN BAHASA YANG HARUS DIPAKAI:",
    aturanBahasa(input.profil.tingkatAkademik),
    "",
    ...(input.analisis
      ? [
          "ANALISIS STRUKTUR MATERI, pakai sebagai panduan memecah:",
          ...bagianDenganHintVisual,
          "",
        ]
      : []),
    "MATERI SUMBER, satu-satunya sumber kebenaran:",
    "<<<",
    input.teks,
    ">>>",
    "",
    "TUGASMU:",
    "1. Pecah materi menjadi bagian-bagian kecil yang masing-masing satu konsep.",
    "2. Tulis ulang penjelasan dengan tingkat bahasa anak ini.",
    "3. Tulis naskah audio untuk tiap bagian mengikuti aturan naskah audio.",
    "4. Tambahkan satu aktivitas singkat di bagian yang paling tepat, dan lengkapi daftar jawaban yang diterima dengan semua varyasi jawaban.",
    "5. Ajukan permintaan gambar hanya untuk bagian yang benar-benar butuh, sesuai preferensi belajar anak ini.",
    "6. Tulis catatan adaptasi yang menjelaskan apa yang diubah dan mengapa, agar guru bisa menilai dengan cepat.",
    "",
    "Ingat: hasil ini ditinjau guru sebelum dipakai siswa.",
    "Keluarkan hanya JSON yang sesuai skema.",
  ].join("\n");
}

/**
 * Snapshot profil untuk arsip.
 *
 * PRD 6.C meminta prompt menyimpan keterlacakan ke materi sumber dan ke
 * profil siswa. Nilai ini disimpan di kolom jejak prompt pada tabel adaptasi.
 */
export function snapshotUntukArsip(
  materialId: string,
  studentId: string,
  profil: SnapshotProfil,
): string {
  return [
    `material_id=${materialId}`,
    `student_id=${studentId}`,
    `profile_snapshot=${JSON.stringify(profil)}`,
  ].join("\n");
}
