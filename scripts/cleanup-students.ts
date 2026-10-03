/**
 * Membersihkan siswa yang tidak sengaja tersimpan, misalnya saat ada tombol
 * wizard yang mengirim formulir sendiri.
 *
 * Tanpa argumen: hanya menampilkan kandidat (dry-run, tidak mengubah data).
 *
 *   npx tsx scripts/cleanup-students.ts
 *   npx tsx scripts/cleanup-students.ts --hapus "Budi Handayani","Aisyah"
 *   npx tsx scripts/cleanup-students.ts --hapus "Aisyah" --force
 *
 * Siswa yang sudah punya materi terbit atau riwayat belajar hanya boleh
 * dihapus dengan --force.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, inArray } from "drizzle-orm";

function loadEnvFile() {
  const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

import { getDb } from "../src/db/client";
import {
  learningSessions,
  materialAdaptations,
  students,
} from "../src/db/schema";

const args = process.argv.slice(2);
const force = args.includes("--force");

function argValue(flag: string): string[] {
  const index = args.indexOf(flag);
  if (index === -1) return [];
  const next = args[index + 1];
  return (next ?? "")
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

const targets = argValue("--hapus");

async function main() {
  const db = getDb();
  const rows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      createdAt: students.createdAt,
    })
    .from(students)
    .orderBy(students.createdAt);

  if (targets.length === 0) {
    console.log(`\nSiswa terdaftar (${rows.length}):\n`);
    for (const row of rows) {
      console.log(`  ${row.createdAt.slice(0, 16)}  ${row.fullName}  (${row.id})`);
    }
    console.log(
      "\nBelum ada yang dihapus. Untuk menghapus, contoh:\n" +
        '  npx tsx scripts/cleanup-students.ts --hapus "Budi Handayani","Aisyah"',
    );
    return;
  }

  const chosen = rows.filter((row) => targets.includes(row.fullName));
  const missing = targets.filter(
    (name) => !chosen.some((row) => row.fullName === name),
  );

  if (missing.length > 0) {
    console.log(`\nNama tidak ditemukan, dilewati: ${missing.join(", ")}`);
  }
  if (chosen.length === 0) {
    console.log("\nTidak ada siswa yang cocok. Tidak ada yang dihapus.");
    return;
  }

  console.log(`\nAkan dihapus ${chosen.length} siswa:\n`);
  const ids: string[] = [];

  for (const row of chosen) {
    const adaptations = await db
      .select({ id: materialAdaptations.id })
      .from(materialAdaptations)
      .where(eq(materialAdaptations.studentId, row.id));
    const sessions = await db
      .select({ id: learningSessions.id })
      .from(learningSessions)
      .where(eq(learningSessions.studentId, row.id));

    const risky = adaptations.length > 0 || sessions.length > 0;
    if (risky && !force) {
      console.log(
        `  LEWATI  ${row.fullName} - punya ${adaptations.length} adaptasi dan ${sessions.length} sesi (pakai --force untuk tetap menghapus)`,
      );
      continue;
    }

    ids.push(row.id);
    console.log(
      `  HAPUS   ${row.fullName} - ${adaptations.length} adaptasi, ${sessions.length} sesi ikut terhapus`,
    );
  }

  if (ids.length === 0) {
    console.log("\nTidak ada yang dihapus.");
    return;
  }

  await db.delete(students).where(inArray(students.id, ids));

  const remaining = await db
    .select({ id: students.id })
    .from(students)
    .where(inArray(students.id, ids));
  console.log(
    `\nSelesai. ${ids.length} siswa dihapus, sisa baris milik mereka: ${remaining.length}.`,
  );
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("pembersihan gagal:", error);
    process.exit(1);
  });
