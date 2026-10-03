/**
 * Bukti bahwa RLS benar-benar ditegakkan.
 *
 * Script ini querying lewat PostgREST memakai ANON key (tanpa login guru).
 * Kalau RLS aktif, semua query harus mengembalikan 0 baris. Kalau ada baris
 * yang muncul, berarti policy belum terpasang dan anon key bisa membaca data.
 *
 * Jalankan: node scripts/verify-rls.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile() {
  const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum diisi.");
  process.exit(1);
}

const TABLES = [
  "profiles",
  "students",
  "student_profiles",
  "classes",
  "class_students",
  "materials",
  "material_adaptations",
  "visual_assets",
  "student_access_tokens",
  "learning_sessions",
  "progress_records",
  "ppi_documents",
  "notifications",
];

async function countAnon(table) {
  const response = await fetch(`${url}/rest/v1/${table}?select=id`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!response.ok) {
    return { error: `${response.status} ${await response.text()}` };
  }
  const contentRange = response.headers.get("content-range") ?? "";
  const total = Number(contentRange.split("/")[1] ?? "0");
  return { total };
}

let failed = 0;
for (const table of TABLES) {
  const result = await countAnon(table);
  if (result.error) {
    failed += 1;
    console.log(`  GAGAL  ${table.padEnd(22)} ${result.error}`);
    continue;
  }
  if (result.total > 0) {
    failed += 1;
    console.log(`  BOCOR  ${table.padEnd(22)} ${result.total} baris terlihat oleh anon`);
    continue;
  }
  console.log(`  AMAN   ${table.padEnd(22)} 0 baris untuk anon`);
}

if (failed > 0) {
  console.error(`\nRLS belum benar: ${failed} tabel bermasalah.`);
  process.exit(1);
}
console.log(`\nRLS aktif pada ${TABLES.length} tabel: anon tidak melihat data apa pun.`);