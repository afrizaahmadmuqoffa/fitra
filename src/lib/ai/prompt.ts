
import type {
  DisabilityType,
  MaterialAnalysis,
  SkillLevel,
  StudentProfile,
} from "@/db/types";

// =========================================================
// KLASIFIKASI HAMBATAN
// =========================================================

/**
 * Tiga kategori hambatan berdasarkan dampaknya terhadap pemrosesan konten.
 *
 * Kategori ini menentukan apakah konten perlu disederhanakan, atau hanya
 * cara penyajian dan interaksi yang perlu disesuaikan.
 *
 * - KOGNITIF: hambatan mempengaruhi pemrosesan informasi dan penalaran.
 *   Konten perlu disederhanakan sesuai tingkat akademik.
 *
 * - KOMUNIKASI: hambatan pada jalur sensorik (pendengaran/penglihatan)
 *   atau produksi bahasa ekspresif. Kapasitas kognitif tidak terdampak.
 *   Konten dipertahankan — yang diubah hanya modalitas penyampaian.
 *
 * - FISIK_MOTORIK: hambatan pada gerak dan kontrol tubuh. Kapasitas
 *   kognitif tidak terdampak. Konten dipertahankan — yang diubah hanya
 *   cara interaksi dan target sentuh.
 *
 * - CAMPURAN: kombinasi dua hambatan atau lebih, atau hambatan yang belum
 *   terklasifikasi. Keputusan simplifikasi diserahkan ke profil akademik.
 */
export type KategoriHambatan =
  | "KOGNITIF"
  | "KOMUNIKASI"
  | "FISIK_MOTORIK"
  | "CAMPURAN";

export const KATEGORI_HAMBATAN: Record<DisabilityType, KategoriHambatan> = {
  // Hambatan kognitif — konten perlu disederhanakan per tingkat akademik
  tunagrahita: "KOGNITIF",
  autis: "KOGNITIF",

  // Hambatan komunikasi sensorik/ekspresif — konten dipertahankan
  tunanetra: "KOMUNIKASI",
  tunarungu: "KOMUNIKASI",
  tunawicara: "KOMUNIKASI",

  // Hambatan fisik motorik — konten dipertahankan
  tunadaksa: "FISIK_MOTORIK",
  tunalaras: "FISIK_MOTORIK",

  // Campuran atau belum terklasifikasi — ikuti profil akademik
  tunaganda: "CAMPURAN",
  lainnya: "CAMPURAN",
};

/**
 * Apakah hambatan ini memerlukan penyederhanaan konten?
 *
 * Hanya KOGNITIF yang perlu disederhanakan. KOMUNIKASI dan FISIK_MOTORIK
 * memiliki kapasitas kognitif normal — menyederhanakan konten mereka justru
 * merendahkan kemampuan dan mengurangi kualitas belajar.
 *
 * Untuk CAMPURAN, keputusan diserahkan ke tingkat akademik aktual siswa.
 */
export function perluSederhanakanKonten(
  kategori: KategoriHambatan,
  tingkatAkademik: SkillLevel,
): boolean {
  if (kategori === "KOGNITIF") return true;
  if (kategori === "CAMPURAN") return tingkatAkademik === "low";
  // KOMUNIKASI dan FISIK_MOTORIK tidak perlu penyederhanaan konten
  return false;
}

/**
 * Label deskriptif untuk kategori hambatan — dipakai dalam prompt ke model.
 */
export const LABEL_KATEGORI: Record<KategoriHambatan, string> = {
  KOGNITIF:
    "Hambatan kognitif — penyederhanaan bahasa dan konten berlaku sesuai tingkat akademik.",
  KOMUNIKASI:
    "Hambatan komunikasi sensorik atau ekspresif — kapasitas kognitif tidak terdampak. " +
    "Pertahankan kedalaman dan kompleksitas konten. Yang diubah hanya modalitas penyampaian dan interaksi.",
  FISIK_MOTORIK:
    "Hambatan fisik motorik — kapasitas kognitif tidak terdampak. " +
    "Pertahankan kedalaman dan kompleksitas konten. Yang diubah hanya cara interaksi dan ukuran target sentuh.",
  CAMPURAN:
    "Kombinasi hambatan atau hambatan belum terklasifikasi. " +
    "Sesuaikan konten berdasarkan profil akademik aktual. Jangan mengasumsikan hambatan kognitif " +
    "bila profil akademik menunjukkan kemampuan sedang atau tinggi.",
};


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
  const kategori = KATEGORI_HAMBATAN[profil.jenisHambatan];

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

  const baris: string[] = [
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
  ];

  // Hanya tambahkan catatan kesulitan membaca bila hambatannya kognitif/campuran
  // DAN kemampuan membaca memang rendah. Untuk hambatan komunikasi/fisik,
  // baris ini tidak relevan dan justru menyesatkan model.
  if (
    (kategori === "KOGNITIF" || kategori === "CAMPURAN") &&
    profil.membaca === "low"
  ) {
    baris.push("kesulitan membaca kalimat panjang — gunakan kalimat sangat pendek");
  }

  return baris.join("; ");
}

// =========================================================
// ATURAN BAHASA
// =========================================================

/**
 * Panduan bahasa berdasarkan tingkat akademik dan kategori hambatan.
 *
 * Batasan numerik (N kata) dihapus karena model cenderung memotong kalimat
 * secara mekanis saat diberi angka, sehingga justru merusak alur penjelasan.
 * Panduan kualitatif lebih efektif karena model dapat menyesuaikan per kalimat.
 *
 * Untuk hambatan non-kognitif (KOMUNIKASI, FISIK_MOTORIK), tidak ada aturan
 * penyederhanaan — cukup bahasa Indonesia yang baik dan sesuai usia sekolah.
 */
function aturanBahasa(level: SkillLevel, kategori: KategoriHambatan): string {
  // Non-kognitif: tidak perlu panduan simplifikasi apapun
  if (kategori === "KOMUNIKASI" || kategori === "FISIK_MOTORIK") {
    return [
      "- Gunakan bahasa Indonesia yang baik, lugas, dan sesuai usia sekolah.",
      "- Istilah teknis boleh dipakai selama diberi penjelasan singkat.",
      "- Tidak ada batasan panjang kalimat — tulis senatural mungkin.",
    ].join("\n");
  }

  // Kognitif low: penyederhanaan maksimal
  if (level === "low") {
    return [
      "- Gunakan kalimat yang sangat pendek. Satu kalimat = satu ide.",
      "- Hindari anak kalimat (klausa yang diawali karena, sehingga, walaupun, agar).",
      "- Pakai kata benda konkret dan kata kerja sederhana yang dikenal sehari-hari.",
      "- Kalau ada dua ide berbeda, pecah menjadi dua kalimat terpisah.",
      "- Ulangi kata kunci penting di kalimat yang berbeda.",
    ].join("\n");
  }

  // Kognitif high: struktur lengkap, tetap mudah dibaca
  if (level === "high") {
    return [
      "- Kalimat boleh memiliki satu klausa anak untuk menunjukkan hubungan sebab-akibat.",
      "- Pakai kata yang lazim dipakai anak usia sekolah.",
      "- Istilah teknis boleh dipakai selama diberi penjelasan singkat.",
      "- Struktur kalimat tidak perlu disederhanakan secara paksa.",
    ].join("\n");
  }

  // Kognitif medium (termasuk CAMPURAN yang perlu disederhanakan)
  return [
    "- Kalimat sedang panjangnya — hindari lebih dari satu klausa anak per kalimat.",
    "- Pakai kosakata sehari-hari yang familiar.",
    "- Hindari istilah teknis tanpa penjelasan.",
    "- Satu paragraf = satu konsep.",
  ].join("\n");
}

/**
 * Aturan tambahan per jenis hambatan.
 *
 * Setiap aturan difokuskan pada dampak spesifik hambatan terhadap cara
 * belajar — bukan generalisasi. Hambatan non-kognitif secara eksplisit
 * menegaskan bahwa kedalaman konten harus dipertahankan.
 */
const ATURAN_HAMBATAN: Record<DisabilityType, string[]> = {
  tunanetra: [
    "- Hambatan bersifat sensorik visual. Kapasitas kognitif tidak terdampak — pertahankan kedalaman dan kompleksitas konten.",
    "- Anak tidak dapat melihat gambar. Jangan membuat gambar (hasVisual harus false untuk semua bagian).",
    "- Jangan menulis referensi visual seperti 'pada gambar', 'lihat warna di atas', atau 'seperti yang terlihat'.",
    "- Tulis semua informasi yang biasanya disampaikan lewat gambar langsung ke dalam teks kalimat.",
    "- Naskah audio menjadi jalur informasi utama dan harus benar-benar berdiri sendiri tanpa perlu melihat layar.",
    "- Alt text tidak diperlukan karena gambar tidak dibuat.",
  ],
  tunarungu: [
    "- Hambatan bersifat sensorik pendengaran. Kapasitas kognitif tidak terdampak — pertahankan kedalaman dan kompleksitas konten.",
    "- Anak tidak dapat mendengar audio. Visual adalah jalur informasi utama.",
    "- Semua informasi wajib ada di teks tertulis — jangan mengandalkan naskah audio untuk menyampaikan informasi apapun.",
    "- Sertakan gambar atau ilustrasi untuk setiap konsep penting agar pemahaman tidak bergantung pada teks panjang.",
    "- Ulangi kata kunci penting di teks tertulis, bukan hanya di naskah audio.",
    "- Naskah audio tetap ditulis untuk kelengkapan data, tetapi bukan jalur utama — jangan menempatkan informasi eksklusif di sana.",
  ],
  tunagrahita: [
    "- Hambatan kognitif — terapkan penyederhanaan konten sesuai tingkat akademik.",
    "- Pakai contoh konkret dan angka nyata, hindari definisi abstrak.",
    "- Pecah setiap pekerjaan atau langkah menjadi urutan satu per satu.",
    "- Ulangi konsep utama di bagian yang berbeda dengan cara yang berbeda.",
    "- Hindari kalimat yang menuntut penalaran lebih dari satu langkah sekaligus.",
    "- Gunakan situasi yang dekat dengan kehidupan sehari-hari anak.",
  ],
  tunadaksa: [
    "- Hambatan bersifat fisik motorik. Kapasitas kognitif tidak terdampak — pertahankan kedalaman dan kompleksitas konten.",
    "- Pilihan jawaban dibuat pendek agar mudah dibaca sekilas.",
    "- Utamakan interaksi menekan pilihan (tap) — hindari aktivitas menyeret (drag) kecuali profil interaksi mengizinkan.",
    "- Satu instruksi per baris supaya mudah dipindai mata.",
    "- Jangan membuat aktivitas yang membutuhkan ketepatan gerakan halus.",
  ],
  autis: [
    "- Hambatan kognitif dan sosial-komunikasi — terapkan penyederhanaan sesuai tingkat akademik.",
    "- Pakai bahasa yang harfiah dan literal — hindari kiasan, sarkasme, humor implisit, dan ungkapan idiomatik.",
    "- Pakai kata 'kamu', bukan 'aku', 'kalian', atau sapaan tidak langsung.",
    "- Satu instruksi per kalimat — jangan menggabungkan dua perintah dalam satu kalimat.",
    "- Sebutkan urutan langkah secara eksplisit: pertama, lalu, kemudian, terakhir.",
    "- Jangan memberi instruksi yang bergantung pada situasi di luar layar atau asumsi konteks sosial.",
    "- Struktur yang konsisten dan dapat diprediksi lebih penting dari variasi.",
  ],
  tunawicara: [
    "- Hambatan bersifat komunikasi ekspresif (produksi suara/bicara). Kapasitas kognitif tidak terdampak — pertahankan kedalaman dan kompleksitas konten.",
    "- Tawarkan semua cara menjawab yang tersedia dan setara nilainya — anak tidak boleh dirugikan karena tidak bisa berbicara.",
    "- Jangan mengasumsikan anak dapat melafalkan atau mengucapkan kata tertentu.",
    "- Setiap aktivitas harus bisa diselesaikan dengan menekan pilihan (tap) meski mode interaksi lain tersedia.",
    "- Jangan membuat aktivitas yang mensyaratkan jawaban suara sebagai satu-satunya pilihan.",
  ],
  tunalaras: [
    "- Hambatan bersifat emosi dan perilaku. Kapasitas kognitif tidak terdampak — pertahankan kedalaman dan kompleksitas konten.",
    "- Gunakan nada yang tenang, hangat, dan konsisten — hindari nada menggurui atau menantang.",
    "- Beri urutan langkah yang jelas dan dapat diprediksi — ketidakpastian dapat memicu frustrasi.",
    "- Hindari kalimat yang membandingkan anak dengan orang lain atau menyiratkan penilaian negatif.",
    "- Gunakan konteks yang relevan dan dekat dengan kehidupan anak agar materi terasa bermakna.",
    "- Beri penghargaan verbal yang tulus di prompt aktivitas ('Coba yuk!' bukan 'Kalau kamu pintar...').",
    "- Hindari konten yang bisa memicu frustrasi — instruksi yang ambigu, soal yang terlalu panjang, atau pilihan yang membingungkan.",
  ],
  tunaganda: [
    "- Kombinasi dua hambatan atau lebih. Sesuaikan konten berdasarkan profil akademik aktual, bukan asumsi.",
    "- Bila profil akademik tinggi atau sedang, pertahankan kedalaman konten — jangan menyederhanakan tanpa alasan.",
    "- Bila profil akademik rendah, terapkan penyederhanaan seperti tunagrahita.",
    "- Kombinasikan aturan dari hambatan yang relevan: bila ada komponen sensorik (tunanetra/tunarungu), terapkan aturan modalitas mereka.",
    "- Bila ada komponen fisik (tunadaksa), terapkan aturan interaksi tunadaksa.",
    "- Prioritaskan mode interaksi yang paling dapat diandalkan sesuai profil siswa.",
  ],
  lainnya: [
    "- Jenis hambatan tidak terklasifikasi. Jangan mengasumsikan hambatan kognitif.",
    "- Sesuaikan kompleksitas konten semata-mata berdasarkan profil akademik aktual siswa.",
    "- Sesuaikan cara interaksi berdasarkan mode interaksi yang tersedia di profil.",
    "- Gunakan bahasa Indonesia yang baik dan sesuai usia sekolah.",
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
  "PRINSIP ADAPTASI — BACA SEBELUM MENGERJAKAN:",
  "Adaptasi bukan berarti selalu menyederhanakan. Ada tiga jenis hambatan dengan kebutuhan yang sangat berbeda:",
  "",
  "1. HAMBATAN KOGNITIF (tunagrahita, autis):",
  "   Hambatan mempengaruhi pemrosesan informasi dan penalaran.",
  "   → Sederhanakan bahasa dan konten sesuai tingkat akademik yang tercantum di profil.",
  "",
  "2. HAMBATAN KOMUNIKASI (tunanetra, tunarungu, tunawicara):",
  "   Hambatan pada jalur sensorik atau produksi suara. Kapasitas kognitif TIDAK terdampak.",
  "   → PERTAHANKAN kedalaman dan kompleksitas konten seperti materi aslinya.",
  "   → Yang diubah HANYA modalitas penyampaian (visual/audio) dan cara menjawab.",
  "   → Jangan menyederhanakan konten hanya karena anak tidak bisa melihat, mendengar, atau berbicara.",
  "",
  "3. HAMBATAN FISIK MOTORIK (tunadaksa, tunalaras):",
  "   Hambatan pada gerak dan kontrol tubuh. Kapasitas kognitif TIDAK terdampak.",
  "   → PERTAHANKAN kedalaman dan kompleksitas konten seperti materi aslinya.",
  "   → Yang diubah HANYA cara interaksi dan ukuran target sentuh.",
  "",
  "Profil siswa mencantumkan jenis hambatan dan tingkat akademik. Gunakan keduanya bersama.",
  "Jangan pernah menyederhanakan konten semata-mata karena nama hambatannya.",
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
  "- Isi bagian berisi 3 sampai 6 kalimat yang menjelaskan konsep secara lengkap.",
  "- Setiap bagian wajib punya naskah audio.",
  "",
  "ATURAN KEDALAMAN KONTEN:",
  "- Jelaskan setiap konsep dengan urutan: definisi atau gambaran umum → contoh konkret → kaitan dengan kehidupan sehari-hari anak.",
  "- Gunakan contoh nyata dan situasi yang dekat dengan pengalaman siswa SLB (misalnya kegiatan rumah, sekolah, pasar).",
  "- Bila suatu konsep sulit dipahami langsung, berikan analogi sederhana sebelum penjelasan utama.",
  "- Ulangi kata kunci penting di kalimat yang berbeda dengan cara berbeda agar melekat.",
  "- Untuk siswa tingkat rendah: jelaskan satu hal, beri contoh, tunjukkan kembali dengan kata berbeda.",
  "- Untuk siswa tingkat sedang: jelaskan konsep, beri dua contoh, minta anak mengaitkan dengan pengalaman.",
  "- Untuk siswa tingkat tinggi: jelaskan konsep, beri contoh, dorong anak membuat kaitan sendiri lewat aktivitas.",
  "",
  "ATURAN NASKAH AUDIO:",
  "- Naskah audio akan dibacakan dengan suara ke anak.",
  "- Bentuknya seperti guru berbicara hangat dan pelan, bukan daftar poin.",
  "- Naskah audio HARUS mencakup SELURUH isi bagian, termasuk semua penjelasan dan contoh — anak yang tidak bisa membaca layar harus tetap mendapat informasi lengkap.",
  "- Dilarang memakai markdown, penanda daftar, tanda pengurut, angka berbentuk digit, dan keterangan adegan.",
  "- Tulis angka dalam bentuk kata supaya terdengar wajar. Contoh: satu dua tiga empat, bukan 1, 2, 3, 4.",
  "- Sebut ulang kata kunci di akhir kalimat.",
  "- Kalimat harus berdiri sendiri tanpa perlu melihat teks di layar.",
  "- Panjang naskah audio boleh lebih panjang dari isi bagian karena harus bisa dipahami hanya dengan didengar.",
  "",
  "ATURAN AKTIVITAS:",
  "- Tiap bagian yang mengandung konsep penting HARUS memiliki minimal satu aktivitas.",
  "- Bagian pengantar atau transisi boleh tidak memiliki aktivitas.",
  "- Setiap soal harus menguji satu konsep spesifik dari bagian itu, bukan hal umum.",
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
  "- Objek utama harus satu, konkret, dan fisik — bukan adegan, aktivitas, atau konsep abstrak.",
  "- Dilarang keras: manusia, wajah, karakter kartun, atau bagian tubuh dalam gambar apapun.",
  "- Dilarang keras: tulisan, angka, huruf, atau label di dalam gambar.",
  "- Scene wajib menyebut objek, jumlah (jika bisa dihitung), warna, dan latar belakang sederhana.",
  "- Alt text wajib menjelaskan objek, jumlah, dan warna dalam satu sampai dua kalimat bahasa Indonesia.",
  "- Batasan keselamatan wajib menyebut larangan gambar yang tidak aman untuk anak.",
  "- Gaya ilustrasi ditentukan sistem — tidak perlu diisi, tidak ada field style di skema.",
  "",
  "FORMAT KELUARAN:",
  "Keluarkan hanya JSON yang sesuai skema. Tanpa penjelasan tambahan.",
].join("\n");

/** Bagian profil yang dikirim ke model. */
function blokProfil(profil: SnapshotProfil): string {
  const kategori = KATEGORI_HAMBATAN[profil.jenisHambatan];
  return [
    "SNAPSHOT PROFIL BELAJAR ANAK (tanpa data identitas):",
    ringkasProfil(profil),
    "",
    `KATEGORI HAMBATAN: ${kategori}`,
    LABEL_KATEGORI[kategori],
    "",
    "ATURAN SPESIFIK UNTUK JENIS HAMBATAN INI:",
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
  const kategori = KATEGORI_HAMBATAN[input.profil.jenisHambatan];

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
    "",
    blokProfil(input.profil),
    "",
    "PANDUAN BAHASA YANG HARUS DIPAKAI:",
    aturanBahasa(input.profil.tingkatAkademik, kategori),
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
    kategori === "KOGNITIF" || (kategori === "CAMPURAN" && perluSederhanakanKonten(kategori, input.profil.tingkatAkademik))
      ? "2. Tulis ulang setiap penjelasan dengan bahasa yang sesuai tingkat akademik anak — gunakan contoh konkret, pecah langkah per langkah, dan hindari abstraksi."
      : "2. Tulis ulang setiap penjelasan dengan MEMPERTAHANKAN kedalaman dan kompleksitas konten aslinya — hanya sesuaikan modalitas penyajian dan cara interaksi.",
    "3. Pastikan setiap bagian memiliki 3–6 kalimat penjelasan yang cukup lengkap, bukan hanya definisi.",
    "4. Tulis naskah audio untuk tiap bagian yang mencakup SELURUH isi — anak yang hanya mendengar harus memahami semuanya.",
    "5. Tambahkan aktivitas di setiap bagian yang mengandung konsep penting (bukan hanya satu aktivitas untuk seluruh materi).",
    "6. Lengkapi daftar jawaban yang diterima dengan semua variasi jawaban yang mungkin.",
    "7. Ajukan permintaan gambar hanya untuk bagian yang benar-benar butuh, sesuai preferensi belajar dan jenis hambatan anak ini.",
    "8. Tulis catatan adaptasi yang menjelaskan apa yang diubah dan mengapa — khususnya bila konten dipertahankan, jelaskan bahwa hambatannya bukan kognitif.",
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
