/**
 * Uji pemuatan modul Server Action.
 *
 * Meniru validasi runtime Next.js: setiap file "use server" hanya boleh
 * mengekspor fungsi async. Aturan ini tidak dicek tsc maupun next build,
 * sehingga harus diuji sendiri sebelum deploy.
 *
 * Jalankan: npx tsx scripts/check-actions-runtime.ts
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/actions";
const IGNORE = new Set(["default", "module.exports", "__esModule", "then"]);

let failures = 0;

async function main() {
  const files = readdirSync(DIR).filter((name) => /\.tsx?$/.test(name));

  for (const name of files) {
    const full = join(DIR, name);
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(full, "utf8"),
    );
    const firstLine = source.split(/\r?\n/)[0]?.trim().replace(/;+$/, "");
    if (firstLine !== '"use server"' && firstLine !== "'use server'") continue;

    try {
      const actions = await import(`../${full.replace(/\\/g, "/")}`);
      const bad = Object.entries(actions).filter(
        ([key, value]) => !IGNORE.has(key) && typeof value !== "function",
      );

      if (bad.length > 0) {
        failures += 1;
        console.log(`  GAGAL  ${name}`);
        for (const [key, value] of bad) {
          console.log(`         ${key} -> ${typeof value}`);
        }
      } else {
        console.log(
          `  OK     ${name.padEnd(24)} ${Object.keys(actions).filter((k) => !IGNORE.has(k)).length} aksi`,
        );
      }
    } catch (error) {
      failures += 1;
      console.log(`  GAGAL  ${name} gagal dimuat: ${(error as Error).message}`);
    }
  }

  if (failures > 0) {
    console.error(
      `\n${failures} file "use server" bermasalah. Next.js akan melempar error saat runtime.`,
    );
    process.exit(1);
  }
  console.log(`\n${files.length} file aksi termuat, semua ekspor berupa fungsi.`);
}

main();