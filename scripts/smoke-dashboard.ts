/**
 * Smoke test halaman guru dengan login sungguhan.
 *
 * Alur: login lewat Supabase Auth -> ambil cookie session -> buka setiap
 * halaman dashboard dengan cookie tersebut. Semua query diuji lewat jalur RLS
 * yang sama dengan produksi.
 *
 * Jalankan: npx tsx scripts/smoke-dashboard.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile() {
  const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const EMAIL = "sri.wahyuni@slb1yogya.sch.id";
const PASSWORD = "fitra2026";
let failures = 0;

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "  LULUS " : "  GAGAL "} ${label.padEnd(42)} ${detail}`);
  if (!ok) failures += 1;
}

async function main() {
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

  // Cookie session Supabase untuk SSE (Server-Side Encryption) pada SSR.
  const cookies = buildCookies(data.session);

  const classId = await findClassId();
  const studentId = await findStudentId();
  const materialId = await findMaterialId();
  const adaptationStudentId = studentId;

  console.log(`\nUji halaman guru terhadap ${BASE}`);
  console.log(`Login: ${data.user.email}\n`);

  const routes: { path: string; expect: RegExp }[] = [
    { path: "/dashboard", expect: /Dasbor|Sri Wahyuni/ },
    { path: "/dashboard/siswa", expect: /Aisyah|Bagas/ },
    { path: "/dashboard/siswa/baru", expect: /Identitas Siswa/ },
    { path: "/dashboard/kelas", expect: /Kelas IV-B/ },
    { path: "/dashboard/materi", expect: /Mengenal Angka/ },
    { path: "/dashboard/materi/baru", expect: /Unggah|Tempelkan/ },
    { path: "/dashboard/progres", expect: /Progres|partisipasi|Partisipasi/ },
    { path: "/dashboard/ppi", expect: /PPI|Program Pendidikan/ },
    { path: "/dashboard/ppi/baru", expect: /PPI|Profil/ },
    { path: "/dashboard/pengaturan", expect: /Pengaturan|Profil guru/ },
  ];

  if (classId) {
    routes.push({ path: `/dashboard/kelas/${classId}`, expect: /Kelas IV-B/ });
    routes.push({ path: `/dashboard/kelas/${classId}/qr`, expect: /Kartu QR/ });
  }
  if (studentId) {
    routes.push({ path: `/dashboard/siswa/${studentId}`, expect: /Aisyah/ });
    routes.push({
      path: `/dashboard/siswa/${studentId}/profil`,
      expect: /Profil|memeta/,
    });
  }
  if (materialId) {
    routes.push({ path: `/dashboard/materi/${materialId}`, expect: /Materi/ });
  }
  if (materialId && adaptationStudentId) {
    routes.push({
      path: `/dashboard/materi/${materialId}/adaptasi/${adaptationStudentId}`,
      expect: /Adaptasi|Sunting/,
    });
  }

  for (const route of routes) {
    const result = await fetchPage(route.path, cookies);
    const ok = result.status === 200 && route.expect.test(result.html);
    check(
      route.path,
      ok,
      ok ? "200" : `status ${result.status}, pola tidak cocok`,
    );
  }

  // Uji sehat Server Action: modul "use server" hanya gagal saat dipanggil.
  const selftest = await fetchPage("/api/selftest", cookies);
  const actionHealthy =
    selftest.status === 200 &&
    selftest.html.includes("termuat") &&
    selftest.html.includes("validationRejectedInvalidInput");
  check(
    "server action bisa dipanggil",
    actionHealthy,
    actionHealthy ? "modul termuat" : `status ${selftest.status}`,
  );

  // Halaman pupil harus menolak guru yang tidak punya token.
  const guard = await fetchPage("/dashboard", undefined, "manual");
  check(
    "dashboard menolak tanpa cookie",
    guard.status === 307 || guard.status === 302,
    `status ${guard.status}`,
  );

  console.log(
    failures === 0
      ? `\nSemua ${routes.length} halaman guru lulus.`
      : `\n${failures} pengujian gagal.`,
  );
  if (failures > 0) process.exit(1);
}

async function fetchPage(
  path: string,
  cookie?: string,
  redirect: "follow" | "manual" = "follow",
) {
  const response = await fetch(`${BASE}${path}`, {
    redirect,
    headers: {
      "user-agent": "fitra-smoke/1.0",
      ...(cookie ? { cookie } : {}),
    },
  });
  const html = await response.text();
  return { status: response.status, html, url: response.url };
}

function buildCookies(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}): string {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const expiresAt = session.expires_at ?? 0;
  const payload = {
    access_token: session.access_token,
    token_type: "bearer",
    expires_in: Math.max(0, expiresAt * 1000 - Date.now()),
    expires_at: expiresAt,
    refresh_token: session.refresh_token,
    user: { id: "", aud: "authenticated" },
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const name = `sb-${projectRef}-auth-token`;
  const chunkSize = 3180;
  const chunks: string[] = [];
  for (let index = 0; index < encoded.length; index += chunkSize) {
    chunks.push(encoded.slice(index, index + chunkSize));
  }

  return chunks
    .map((chunk, index) => {
      // @supabase/ssr menamai cookie potongannya `<nama>.<index>`.
      const key = chunks.length > 1 ? `${name}.${index}` : name;
      return `${key}=base64-${chunk}`;
    })
    .join("; ");
}

/** Cari id dari database memakai service-role Supabase REST. */
async function lookup(table: string, query: string, column = "id") {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${query}&select=${column}`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    },
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as Record<string, string>[];
  return rows[0]?.[column] ?? null;
}

async function findClassId() {
  return lookup("classes", "name=eq.Kelas%20IV-B");
}

async function findStudentId() {
  return lookup("students", "full_name=eq.Aisyah%20Putri%20Ramadhani");
}

async function findMaterialId() {
  return lookup("materials", "title=eq.Mengenal%20Angka%201%20sampai%2010");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("smoke dashboard gagal:", error);
    process.exit(1);
  });