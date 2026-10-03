/**
 * Pagar regresi untuk file "use server".
 *
 * Next.js memvalidasi setiap export file "use server" saat runtime:
 *   A "use server" file can only export async functions, found object.
 * Aturan itu TIDAK dicek oleh tsc maupun npm run build, sehingga objek biasa
 * (misalnya skema zod) bisa lolos build lalu membuat SELURUH Server Action
 * di file tersebut gagal dimuat. Gejalanya di UI: tombol loading selamanya.
 *
 * Skrip ini memindai src/actions dan gagal sebelum deploy bila aturan dilanggar.
 *
 * Jalankan: node scripts/check-actions.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const problems = [];

/** Ekspor bertipe async function saja yang diizinkan. */
const ALLOWED = /^(export\s+)?(default\s+)?async\s+function\s+[A-Za-z0-9_$]+/;
const TYPE_ONLY = /^export\s+type\s+/;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    check(full);
  }
}

function check(file) {
  const source = readFileSync(file, "utf8");
  const firstLine = source.split(/\r?\n/)[0]?.trim().replace(/;+$/, "");
  if (firstLine !== '"use server"' && firstLine !== "'use server'") return;

  const lines = source.split(/\r?\n/);
  let found = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // type-only export dihapus compiler, aman.
    if (TYPE_ONLY.test(trimmed)) return;
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      return;
    }

    // export const/let/var/function (bukan async)
    if (/^export\s+(const|let|var)\s/.test(trimmed) || /^export\s+function\s/.test(trimmed)) {
      if (!ALLOWED.test(trimmed)) {
        problems.push(
          `${file.replace(/\\/g, "/")}:${index + 1}  ${trimmed.slice(0, 78)}`,
        );
        found += 1;
      }
      return;
    }

    // export default non-fungsi
    if (/^export\s+default\s/.test(trimmed) && !ALLOWED.test(trimmed)) {
      problems.push(`${file.replace(/\\/g, "/")}:${index + 1}  ${trimmed.slice(0, 78)}`);
      found += 1;
    }
  });

  if (found === 0) {
    console.log(`  OK      ${file.replace(/\\/g, "/")}`);
  }
}

walk(ROOT);

if (problems.length > 0) {
  console.error("\nFile \"use server\" hanya boleh mengekspor async function:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nNext.js akan melempar error saat runtime:\n" +
      '  A "use server" file can only export async functions, found object.\n' +
      "Pindahkan nilai non-fungsi (misalnya skema zod) ke file biasa, contoh src/lib/validation.ts.",
  );
  process.exit(1);
}

console.log("\nSemua file \"use server\" hanya mengekspor async function.");