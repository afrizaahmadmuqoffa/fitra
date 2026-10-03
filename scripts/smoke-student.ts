/**
 * Smoke test halaman siswa lewat HTTP.
 *
 * Token QR hanya ada di hash di database, jadi token plaintext diambil dari
 * file yang ditulis seed (scripts/seed.ts). Jalankan seed lebih dulu, lalu:
 *   npx tsx scripts/smoke-student.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Smoke test selalu menembak dev server lokal; domain produksi dipakai UI QR.
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const TOKEN_FILE = join(process.cwd(), ".seed-tokens.json");

type SeedToken = { student: string; token: string; active: boolean };

let failures = 0;

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "  LULUS " : "  GAGAL "} ${label.padEnd(40)} ${detail}`);
  if (!ok) failures += 1;
}

async function fetchPage(path: string, redirect: "follow" | "manual" = "follow") {
  const response = await fetch(`${BASE}${path}`, {
    redirect,
    headers: { "user-agent": "fitra-smoke/1.0" },
  });
  const html = await response.text();
  return { status: response.status, html, url: response.url };
}

function readTokens(): SeedToken[] {
  try {
    const parsed = JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as SeedToken[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error(
      `File ${TOKEN_FILE} tidak ada. Jalankan dulu: npx tsx scripts/seed.ts`,
    );
    process.exit(1);
  }
}

async function main() {
  const tokens = readTokens();
  console.log(`\nUji halaman siswa terhadap ${BASE}`);
  console.log(`Token dari seed: ${tokens.length}\n`);

  check("token siswa tersedia", tokens.length > 0, `${tokens.length} token`);

  const active = tokens.find((item) => item.active) ?? tokens[0];
  const inactive = tokens.find((item) => !item.active);

  const entry = await fetchPage(`/belajar/${active.token}`);
  check(
    "pintu masuk sesi terbuka",
    entry.status === 200 && entry.html.includes("Mulai Belajar"),
    `status ${entry.status}`,
  );

  const list = await fetchPage(`/belajar/${active.token}/sesi`);
  check("daftar materi terbuka", list.status === 200, `status ${list.status}`);

  const adaptation = list.html.match(/\/belajar\/[a-z0-9]+\/sesi\/([0-9a-f-]{36})/);
  check(
    "tautan adaptasi ada di daftar",
    Boolean(adaptation),
    adaptation ? adaptation[1] : "tidak ditemukan",
  );

  if (adaptation) {
    const player = await fetchPage(
      `/belajar/${active.token}/sesi/${adaptation[1]}`,
    );
    check(
      "pemutar adaptif terbuka",
      player.status === 200,
      `status ${player.status}`,
    );

    const done = await fetchPage(
      `/belajar/${active.token}/selesai?benar=3&dijawab=3&total=3`,
    );
    check("layar selesai terbuka", done.status === 200, `status ${done.status}`);
  }

  const unknown = await fetchPage("/belajar/tidak-dikenal-000");
  check(
    "token tak dikenal: pesan ramah",
    unknown.status === 200 && unknown.html.includes("Kode QR tidak dikenali"),
    `status ${unknown.status}`,
  );

  if (inactive) {
    const blocked = await fetchPage(`/belajar/${inactive.token}`);
    check(
      "token nonaktif: pesan ramah",
      blocked.status === 200 &&
        blocked.html.includes("dinonaktifkan"),
      `status ${blocked.status}`,
    );
  }

  const guard = await fetchPage("/dashboard", "manual");
  check(
    "dashboard menolak tanpa login",
    guard.status === 307 || guard.status === 302 || guard.url.includes("/masuk"),
    `status ${guard.status} -> ${guard.url}`,
  );

  console.log(
    failures === 0
      ? "\nSemua pengujian HTTP lulus."
      : `\n${failures} pengujian gagal.`,
  );
  if (failures > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("smoke student gagal:", error);
    process.exit(1);
  });