/**
 * Uji lapis data Tahap 2: memastikan RLS benar-benar membatasi data per guru.
 *
 * 1. Ambil JWT guru lewat Supabase Auth (password grant) dengan kredensial seed.
 * 2. Buka koneksi Postgres, turunkan privilege ke role `authenticated`, lalu
 *    query dengan pola yang sama seperti src/db/rls.ts.
 * 3. Buktikan guru melihat datanya sendiri.
 * 4. Buktikan JWT guru lain tidak melihat satu baris pun dari guru pertama.
 *
 * Jalankan: npx tsx scripts/smoke-rls.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

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
import { classes, materials, students } from "../src/db/schema";
import { withRlsDb } from "../src/db/rls";

const EMAIL = "sri.wahyuni@slb1yogya.sch.id";
const PASSWORD = "fitra2026";

let failures = 0;

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "  LULUS " : "  GAGAL "} ${label.padEnd(34)} ${detail}`);
  if (!ok) failures += 1;
}

async function signIn() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`Login guru gagal: ${error?.message ?? "tanpa sesi"}`);
  }
  return data.session;
}

async function main() {
  const db = getDb();
  const session = await signIn();
  console.log(`\nJWT guru diperoleh untuk ${session.user.email}`);
  console.log(`auth.uid() = ${session.user.id}\n`);

  const claims = { sub: session.user.id, email: session.user.email ?? undefined };

  // 1. Guru melihat datanya sendiri.
  const mine = await withRlsDb(claims, async (tx) => {
    const [studentRows, classRows, materialRows] = await Promise.all([
      tx.select({ id: students.id, name: students.fullName }).from(students),
      tx.select({ id: classes.id, name: classes.name }).from(classes),
      tx.select({ id: materials.id, title: materials.title }).from(materials),
    ]);
    return {
      students: studentRows,
      classes: classRows,
      materials: materialRows,
    };
  });

  check(
    "guru membaca siswa sendiri",
    mine.students.length > 0,
    `${mine.students.length} siswa: ${mine.students.map((row) => row.name).join(", ")}`,
  );
  check(
    "guru membaca kelas sendiri",
    mine.classes.length > 0,
    `${mine.classes.length} kelas: ${mine.classes.map((row) => row.name).join(", ")}`,
  );
  check(
    "guru membaca materi sendiri",
    mine.materials.length > 0,
    `${mine.materials.length} materi: ${mine.materials.map((row) => row.title).join(", ")}`,
  );

  // 2. JWT guru lain tidak boleh melihat data guru pertama.
  const otherClaims = {
    sub: "00000000-0000-4000-8000-000000000000",
    email: "guru.lain@example.com",
  };
  const foreign = await withRlsDb(otherClaims, async (tx) => {
    const [studentRows, classRows, materialRows] = await Promise.all([
      tx.select({ id: students.id }).from(students),
      tx.select({ id: classes.id }).from(classes),
      tx.select({ id: materials.id }).from(materials),
    ]);
    return {
      students: studentRows.length,
      classes: classRows.length,
      materials: materialRows.length,
    };
  });

  check(
    "JWT guru lain tidak bisa baca siswa",
    foreign.students === 0,
    `${foreign.students} baris terlihat (harus 0)`,
  );
  check(
    "JWT guru lain tidak bisa baca kelas",
    foreign.classes === 0,
    `${foreign.classes} baris terlihat (harus 0)`,
  );
  check(
    "JWT guru lain tidak bisa baca materi",
    foreign.materials === 0,
    `${foreign.materials} baris terlihat (harus 0)`,
  );

  // 3. Role service_role (jalur siswa) memang melihat data.
  const viaService = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.teacherId, session.user.id));
  check(
    "jalur service_role tetap berfungsi",
    viaService.length > 0,
    `${viaService.length} siswa lewat jalur siswa/service`,
  );

  console.log(
    failures === 0
      ? "\nSemua pengujian lapis data lulus."
      : `\n${failures} pengujian gagal.`,
  );
  if (failures > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("smoke test gagal:", error);
    process.exit(1);
  });