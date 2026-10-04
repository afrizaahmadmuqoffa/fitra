/**
 * Menjalankan ulang seluruh policy RLS.
 *
 * Kenapa perlu: drizzle-kit push menulis ulang tabel yang berubah, dan policy
 * RLS yang tidak dikenal drizzle akan ikut terhapus. Setelah push, setiap
 * tabel kembali terbuka untuk anon sampai policy dibuat ulang. Skrip ini
 * menutup celah itu dan dijahit ke perintah db:push.
 *
 * Berkas SQL-nya idempotent, jadi aman dijalankan berkali-kali.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

function ambilEnvLokal() {
  if (process.env.DATABASE_URL) return;
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

async function main() {
  ambilEnvLokal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL belum tersedia.");
    process.exit(1);
  }

  const sql = readFileSync(join(process.cwd(), "supabase/sql/02_rls.sql"), "utf8");
  const koneksi = postgres(url, { ssl: "require", max: 1, connect_timeout: 15 });

  try {
    await koneksi.unsafe(sql);
    console.log("Policy RLS diterapkan ulang pada 13 tabel.");
  } finally {
    await koneksi.end({ timeout: 5 });
  }
}

void main().catch((error) => {
  console.error("Gagal menerapkan RLS:", error instanceof Error ? error.message : error);
  process.exit(1);
});
