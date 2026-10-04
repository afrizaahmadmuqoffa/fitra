/**
 * Langkah 0 — verifikasi alur unggah lewat tiket.
 *
 * Menguji jalur yang persis akan dipakai peramban:
 *   1. server membuat tiket lewat service role
 *   2. "klien" (anon key) mengunggah berkas langsung ke Supabase
 *   3. berkas dipastikan ada, lalu dihapus lagi
 *
 * Berkas uji dibersihkan di akhir, jadi tidak meninggalkan sampah di bucket.
 *
 * Jalankan: npx tsx scripts/cek-upload-tiket.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function ambilEnvLokal() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const isi = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const baris of isi.split(/\r?\n/)) {
      const cocok = baris.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!cocok) continue;
      if (!process.env[cocok[1]]) {
        process.env[cocok[1]] = cocok[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // abaikan
  }
}
ambilEnvLokal();

const BUCKET = "materials";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  for (const [nama, nilai] of [
    ["NEXT_PUBLIC_SUPABASE_URL", url],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anon],
    ["SUPABASE_SERVICE_ROLE_KEY", service],
  ] as const) {
    if (!nilai) {
      console.log("GAGAL  " + nama + " belum terisi");
      process.exit(1);
    }
  }

  const admin = createClient(url!, service!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const klien = createClient(url!, anon!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const path = "materi/uji-tiket/berkas-uji-" + Date.now() + ".txt";
  let tiket: { path: string; token: string } | null = null;

  try {
    // 1. Server membuat tiket.
    const dibuat = await admin.storage.from(BUCKET).createSignedUploadUrl(path, {
      upsert: false,
    });
    if (dibuat.error || !dibuat.data?.token) {
      console.log("GAGAL  createSignedUploadUrl: " + (dibuat.error?.message ?? "tanpa token"));
      process.exit(1);
    }
    tiket = { path: dibuat.data.path, token: dibuat.data.token };
    console.log("LOLOS  tiket dibuat");
    console.log("  path : " + tiket.path);
    console.log(
      "  url  : " + String(dibuat.data.signedUrl).slice(0, 88) + "...",
    );

    // 2. "Klien" mengunggah lewat anon key, persis seperti peramban.
    const isi = "Uji unggah tiket Fitra. Baris kedua.\n";
    // Blob tanpa tipe akan menjadi application/octet-stream, dan bucket ini
    // hanya menerima tiga tipe tertentu. Di peramban, objeknya adalah File
    // yang sudah membawa tipe sendiri.
    const berkas = new File([isi], "berkas-uji.txt", { type: "text/plain" });
    const unggah = await klien.storage
      .from(BUCKET)
      .uploadToSignedUrl(tiket.path, tiket.token, berkas, {
        contentType: "text/plain",
        upsert: false,
      });

    if (unggah.error) {
      console.log("GAGAL  uploadToSignedUrl: " + unggah.error.message);
      console.log("");
      console.log("Artinya Storage menolak unggah dari anon key.");
      console.log("Kemungkinan besar butuh policy INSERT pada storage.objects.");
      process.exit(1);
    }
    console.log("LOLOS  berkas terunggah lewat anon key");

    // 3. Pastikan isinya benar-benar tersimpan.
    const unduh = await admin.storage.from(BUCKET).download(tiket.path);
    if (unduh.error) {
      console.log("GAGAL  berkas tidak bisa diunduh: " + unduh.error.message);
      process.exit(1);
    }
    const teks = await unduh.data.text();
    const cocok = teks.includes("Uji unggah tiket Fitra");
    console.log(
      (cocok ? "LOLOS  " : "GAGAL  ") + " isi berkas utuh setelah diunduh",
    );

    // 4. Cek apakah anon tanpa tiket juga bisa menulis. Seharusnya TIDAK bisa.
    const langsung = await klien.storage
      .from(BUCKET)
      .upload(
        path + "-tanpa-tiket",
        new File(["x"], "x.txt", { type: "text/plain" }),
        { contentType: "text/plain" },
      );
    console.log(
      (!langsung.error ? "PERINGATAN  " : "LOLOS  ") +
        " unggah tanpa tiket ditolak: " +
        (langsung.error?.message ?? "TIDAK DITOLAK, ini tidak aman"),
    );
    if (!langsung.error) {
      await admin.storage.from(BUCKET).remove([path + "-tanpa-tiket"]);
    }

    console.log("");
    console.log(cocok ? "RANGKUMAN: alur tiket berfungsi." : "RANGKUMAN: ada masalah.");
    process.exit(cocok ? 0 : 1);
  } finally {
    // 5. Bersihkan berkas uji.
    if (tiket) {
      const hapus = await admin.storage.from(BUCKET).remove([tiket.path]);
      console.log(
        hapus.error
          ? "PERINGATAN  berkas uji gagal dihapus: " + hapus.error.message
          : "BERSIH  berkas uji sudah dihapus",
      );
    }
  }
}

void main();
