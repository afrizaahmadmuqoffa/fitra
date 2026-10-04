import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit hanya membaca berkas .env secara bawaan, sedangkan proyek ini
 * menyimpan kredensial di .env.local. Tanpa pemuatan manual, perintah
 * db:push dan db:generate berjalan tanpa DATABASE_URL.
 */
function muatEnvLokal() {
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
    // Biarkan kosong; drizzle-kit akan melaporkan sendiri.
  }
}

muatEnvLokal();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
    ssl: "require",
  },
  strict: true,
  verbose: true,
});
