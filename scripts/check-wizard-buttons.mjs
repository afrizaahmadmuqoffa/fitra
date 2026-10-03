/**
 * Pagar regresi untuk tombol wizard.
 *
 * Gejala bug yang dicegah: saat langkah terakhir memakai `type="submit"` dan
 * langkah sebelumnya `type="button"` pada elemen yang sama, React memakai
 * ulang node DOM dan hanya menukar atribut `type`. Browser lalu menjalankan
 * default action dari node yang baru diklik, sehingga formulir terkirim
 * sendiri tanpa disentuh pengguna.
 *
 * Aturan ini tidak dicek tsc maupun next build, jadi harus diperiksa sendiri.
 *
 * Jalankan: node scripts/check-wizard-buttons.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const problems = [];

/** Step atau index langkah: step < STEPS.length - 1, step === 2, idx < 3, ... */
const STEP_TEST = /\{\s*(?:step|stepIndex|idx|index)\s*[<>=]+\s*[A-Za-z0-9_.]+/;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx|jsx)$/.test(entry.name)) continue;
    check(full);
  }
}

function check(file) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("type=\"submit\"") || !source.includes("type=\"button\"")) {
    return;
  }

  const lines = source.split(/\r?\n/);
  const relative = file.replace(/\\/g, "/");

  for (let i = 0; i < lines.length; i += 1) {
    if (!STEP_TEST.test(lines[i])) continue;

    // Ambil seluruh isi cabang ternary, dari baris ini sampai blok ditutup.
    const block = lines.slice(i, Math.min(lines.length, i + 40));
    const text = block.join("\n");
    const closeAt = text.indexOf("\n      )}");

    const scope = closeAt > 0 ? text.slice(0, closeAt) : text;

    const hasSubmit = scope.includes('type="submit"');
    const hasButton = scope.includes('type="button"');
    if (!hasSubmit || !hasButton) continue;

    // Wajib ada key pada elemen yang menukar type, jika belum pakai WizardFooter.
    if (scope.includes("<WizardFooter")) continue;
    const hasKey = /<Button[^>]*\bkey=/.test(scope);
    if (!hasKey) {
      problems.push(
        `${relative}:${i + 1}  ternary langkah menukar type button/submit tanpa key`,
      );
    } else {
      console.log(`  OK      ${relative}:${i + 1}`);
    }
    i += Math.min(lines.length, 40);
  }
}

walk(ROOT);

if (problems.length > 0) {
  console.error("\nTombol wizard menukar type tanpa key akan mengirim formulir sendiri:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nPerbaikannya: pakai komponen WizardFooter, atau beri key berbeda pada " +
      'setiap cabang (<Button key="next" …> dan <Button key="submit" …>).',
  );
  process.exit(1);
}

console.log('\nTidak ada pola tombol wizard yang rawan kirim formulir sendiri.');