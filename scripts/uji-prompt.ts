/**
 * Uji prompt AI terhadap data dummy yang nyata.
 *
 * Tujuannya bukan hanya melihat JSON valid, tapi menilai hasilnya secara
 * praktis: apakah panjang kalimat mengikuti profil, apakah naskah audio layak
 * dibacakan, dan apakah daftar jawaban yang diterima cukup variatif.
 *
 * Jalankan: npx tsx scripts/uji-prompt.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile() {
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!match) continue;
      if (!process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Andalkan env yang sudah ada di shell.
  }
}
loadEnvFile();

import { generateJson, MODEL_TEKS, TIMEOUT } from "../src/lib/ai/gemini";
import { SKEMA_ADAPTASI, ZodAdaptasi, keAdaptedContent } from "../src/lib/ai/schema";
import {
  bangunPromptAdaptasi,
  keSnapshotProfil,
  SISTEM_ADAPTASI,
} from "../src/lib/ai/prompt";
import { students, studentProfiles } from "../src/lib/dummy/people";

const MATERI = [
  "Bagian-Bagian Tumbuhan",
  "",
  "Tumbuhan memiliki bagian-bagian utama yang menjalankan tugas tertentu.",
  "Akar berfungsi menyerap air dan mineral dari tanah sertaZRUE mengikat tumbuhan agar tidak roboh.",
  "Batang berfungsi menyokong tumbuhan dan mengangkut air dari akar ke daun.",
  "Daun berfungsi menangkap cahaya matahari untuk membuat zat makanan melalui fotosintesis.",
  "Bunga berfungsi sebagai alat reproduksi tumbuhan.",
  "Buah terbentuk dari bakal buah setelah pembuahan. Fungsinya melindungi biji.",
  "Biji merupakan bagian tumbuhan yang dapat berkembang menjadi tumbuhan baru.",
  "",
  "Latihan:",
  "1. Bagian tumbuhan yang menyerap air dari tanah adalah akar.",
  "2. Bagaimana cara tumbuhan membuat zat makanan? Daun menangkap cahaya matahari.",
  "3. Pilih bagian yang mengangkut air dari akar ke daun.",
].join("\n");

const TARGET = process.env.UJI_SISWA ?? "stu-citra";

function judul(teks: string) {
  console.log("\n=== " + teks + " ===");
}

function rataRataKata(teks: string): number {
  const kalimat = teks.split(/[.!?]\s+/).filter(Boolean);
  if (kalimat.length === 0) return 0;
  const total = kalimat.reduce(
    (jumlah, item) => jumlah + item.split(/\s+/).filter(Boolean).length,
    0,
  );
  return Math.round((total / kalimat.length) * 10) / 10;
}

function cekKondisi(nama: string, benar: boolean) {
  console.log((benar ? "LOLOS  " : "PERIKSA ") + nama);
}

async function main() {
  const siswa = students.find((item) => item.id === TARGET);
  const profil = studentProfiles.find((item) => item.studentId === TARGET);

  if (!siswa || !profil) {
    console.log("Siswa uji tidak ditemukan: " + TARGET);
    process.exit(1);
  }

  console.log("Model: " + MODEL_TEKS);
  console.log("Siswa uji: " + siswa.fullName + " (" + siswa.disabilityType + ")");
  console.log("Tingkat akademik: " + profil.academicLevel);

  const snapshot = keSnapshotProfil(profil, siswa.disabilityType);
  console.log("\nSnapshot profil yang dikirim ke model:");
  console.log(JSON.stringify(snapshot, null, 2));

  const bocor = Object.keys(snapshot).filter((kunci) =>
    /nama|kelas|sekolah|umur|usia|jenisKelamin|foto|catatan/i.test(kunci),
  );
  cekKondisi(
    "snapshot tidak memuat kunci identitas",
    bocor.length === 0,
  );
  if (bocor.length > 0) console.log("   bocor: " + bocor.join(", "));

  const teksSnapshot = JSON.stringify(snapshot);
  cekKondisi(
    "nama siswa tidak muncul di snapshot",
    !teksSnapshot.includes(siswa.fullName),
  );

  judul("Panggilan adaptasi");
  const mulai = Date.now();
  const hasil = await generateJson({
    sistem: SISTEM_ADAPTASI,
    prompt: bangunPromptAdaptasi({
      judul: "Bagian-Bagian Tumbuhan",
      mapel: "Ilmu Pengetahuan Alam",
      teks: MATERI,
      analisis: null,
      profil: snapshot,
    }),
    schema: SKEMA_ADAPTASI,
    validasi: ZodAdaptasi,
    label: "adaptasi materi",
    timeoutMs: TIMEOUT.adaptasi,
  });
  const durasi = Math.round((Date.now() - mulai) / 1000);

  console.log("Selesai dalam " + durasi + " detik");
  console.log(
    "Token: input " +
      (hasil.usage?.inputTokens ?? "?") +
      ", output " +
      (hasil.usage?.outputTokens ?? "?"),
  );

  const konten = keAdaptedContent(hasil.data, TARGET);
  console.log("Jumlah bagian: " + konten.sections.length);
  console.log("Catatan adaptasi: " + hasil.data.adaptationNotes);
  console.log("Permintaan gambar: " + konten.requests.length);

  let adaAngkaDiAudio = 0;
  let adaMarkdownDiAudio = 0;
  let judulTerlaluPanjang = 0;
  let jawabanCukupVariatif = 0;
  let totalInteraksi = 0;

  for (const bagian of konten.sections) {
    console.log("\n--- BAGIAN " + (bagian.index + 1) + " ---");
    console.log("Judul: " + bagian.title);

    const kataJudul = bagian.title.split(/\s+/).length;
    if (kataJudul > 6) judulTerlaluPanjang += 1;
    console.log("  kata pada judul: " + kataJudul + " (batas 6)");

    console.log("  rata-rata kata per kalimat: " + rataRataKata(bagian.body.join(" ")));
    console.log("  naskah audio: " + bagian.audioScript);

    if (/\d/.test(bagian.audioScript)) adaAngkaDiAudio += 1;
    if (/[*#`|]|^\s*[-*]/m.test(bagian.audioScript)) adaMarkdownDiAudio += 1;

    for (const interaksi of bagian.interactions) {
      totalInteraksi += 1;
      if (interaksi.acceptedAnswers.length >= 2) jawabanCukupVariatif += 1;
      console.log("  soal: " + interaksi.prompt);
      console.log("  jenis: " + interaksi.kind);
      console.log(
        "  pilihan: " +
          interaksi.options
            .map((opsi) => opsi.label + (opsi.correct ? " [benar]" : ""))
            .join(" | "),
      );
      console.log(
        "  jawaban diterima (" +
          interaksi.acceptedAnswers.length +
          "): " +
          JSON.stringify(interaksi.acceptedAnswers),
      );
    }

    for (const media of bagian.media) {
      console.log("  alt text: " + media.altText);
    }
  }

  judul("RINGKASAN");
  console.log("Bagian: " + konten.sections.length);
  console.log("Total interaksi: " + totalInteraksi);
  console.log("Permintaan gambar: " + konten.requests.length);
  console.log("");
  cekKondisi(
    "tidak ada judul lebih dari 6 kata",
    judulTerlaluPanjang === 0,
  );
  cekKondisi(
    "naskah audio bebas angka digit",
    adaAngkaDiAudio === 0,
  );
  cekKondisi(
    "naskah audio bebas markdown",
    adaMarkdownDiAudio === 0,
  );
  cekKondisi(
    "semua interaksi punya minimal 2 jawaban diterima",
    totalInteraksi > 0 && jawabanCukupVariatif === totalInteraksi,
  );
  cekKondisi(
    "semua aset visual punya alt text",
    konten.requests.every((item) => item.altText.length >= 8),
  );
}

void main();
