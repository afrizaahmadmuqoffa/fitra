/**
 * Log diagnostik untuk fitur AI.
 *
 * Tujuan: saat ada masalah di production, penyebabnya harus terlihat tanpa
 * perlu menebak. Semua output memakai awalan FITRA-AI supaya mudah dicari di
 * log Vercel dengan pencarian teks.
 *
 * Yang SENGAJA tidak pernah dicatat: kunci API, isi token QR, dan data
 * pribadi siswa. Prompt adaptasi hanya dicatat setelah nama anak dihapus.
 */

const AWALAN = "FITRA-AI";

/** Log ini aktif kalau FITRA_AI_DEBUG=1 atau NODE_ENV bukan production. */
const aktif =
  process.env.FITRA_AI_DEBUG === "1" || process.env.NODE_ENV !== "production";

/** Jumlah karakter nilai yang boleh masuk log. */
const POTONGAN = 300;

function potong(nilai: string): string {
  const bersih = nilai.replace(/\s+/g, " ").trim();
  return bersih.length > POTONGAN
    ? bersih.slice(0, POTONGAN) + "..."
    : bersih;
}

function waktu(): string {
  return new Date().toISOString().slice(11, 23);
}

export type CatatanDebug = Record<string, string | number | boolean | null>;

/** Rakit pasangan kunci dan nilai menjadi potongan teks untuk log. */
function formatData(data?: CatatanDebug): string {
  if (!data) return "";
  const bagian = Object.entries(data).map(
    ([kunci, nilai]) => `${kunci}=${nilai === null ? "-" : String(nilai)}`,
  );
  return " " + bagian.join(" ");
}

function tulis(tingkat: "info" | "galat" | "peringatan", pesan: string) {
  const baris = `${waktu()} [${AWALAN}] ${tingkat.toUpperCase()} ${pesan}`;
  if (tingkat === "galat") {
    console.error(baris);
  } else if (tingkat === "peringatan") {
    console.warn(baris);
  } else {
    console.log(baris);
  }
}

export const debug = {
  aktif: aktif,

  info(pesan: string, data?: CatatanDebug) {
    if (!aktif) return;
    tulis("info", pesan + formatData(data));
  },

  peringatan(pesan: string, data?: CatatanDebug) {
    if (!aktif) return;
    tulis("peringatan", pesan + formatData(data));
  },

  /** Galat selalu dicatat, bahkan di production, karena inilah yang dicari. */
  galat(pesan: string, data?: CatatanDebug) {
    tulis("galat", pesan + formatData(data));
  },

  /** Potongan nilai yang aman untuk dicatat. */
  cuplik(nilai: string): string {
    return potong(nilai);
  },
};
