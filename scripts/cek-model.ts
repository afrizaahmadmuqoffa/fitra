/**
 * Langkah 0 Tahap 3 — verifikasi API sungguhan sebelum menulis kode AI.
 *
 * Script ini read-only: tidak mengubah apa pun, hanya memanggil endpoint
 * catalogue dan satu panggilan uji kecil. Gunanya supaya kita tidak
 * menulis 15 file di atas asumsi yang salah.
 *
 * Jalankan: npx tsx scripts/cek-model.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile() {
  try {
    const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!match) continue;
      if (!process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Andalkan env yang sudah ada di shell.
  }
}
loadEnvFile();

const MODEL_TEKS = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.8-flash";
const MODEL_GAMBAR =
  process.env.POLLINATIONS_IMAGE_MODEL ?? "black-forest-labs/flux.1-schnell";

function judul(teks: string) {
  console.log("\n=== " + teks + " ===");
}

function potong(teks: string, maksimal = 90): string {
  const bersih = teks.replace(/\s+/g, " ").trim();
  return bersih.length > maksimal ? bersih.slice(0, maksimal) + "..." : bersih;
}

let gagal = 0;

async function cek1DaftarModelGemini() {
  judul("1. Gemini — daftar model yang tersedia untuk kunci ini");
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("GAGAL  GEMINI_API_KEY tidak ada di .env.local");
    gagal += 1;
    return;
  }
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200";
  const response = await fetch(url, { headers: { "x-goog-api-key": key } });
  console.log("HTTP " + response.status + " " + response.statusText);

  if (!response.ok) {
    const badan = await response.text();
    console.log("GAGAL  " + potong(badan, 300));
    console.log(
      "       Kunci ditolak. Cek GEMINI_API_KEY di .env.local dan di Vercel.",
    );
    gagal += 1;
    return;
  }

  const data = (await response.json()) as {
    models?: { name: string; displayName?: string; description?: string }[];
  };
  const models = data.models ?? [];
  console.log("Total model terlihat: " + models.length);

  const flash = models.filter((item) => /flash/i.test(item.name));
  console.log("\nModel flash yang tersedia:");
  for (const item of flash.slice(0, 12)) {
    console.log("  - " + item.name.replace("models/", ""));
  }

  const ada = models.some((item) => item.name === "models/" + MODEL_TEKS);
  console.log(
    "\n" +
      (ada ? "LOLOS" : "GAGAL") +
      '  model yang diminta "' +
      MODEL_TEKS +
      '" ' +
      (ada ? "tersedia" : "TIDAK tersedia di daftar"),
  );
  if (!ada) gagal += 1;

  const info = models.find((item) => item.name === "models/" + MODEL_TEKS);
  if (info?.description) {
    console.log("\nDeskripsi resmi:");
    console.log("  " + potong(info.description, 400));
  }
}

async function cek2UjiStrukturGemini() {
  judul("2. Gemini — uji structured output (kode jalur yang akan dipakai)");
  // Puncak permintaan model Flash memang sering 503 sementara, jadi percobaan
  // diulang dengan jeda memanjang sebelum menyerah.
  const percobaanMaks = 4;
  for (let percobaan = 1; percobaan <= percobaanMaks; percobaan += 1) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: MODEL_TEKS,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Ringkas kalimat ini jadi satu bagian materi untuk siswa SDLB: Tumbuhan memiliki akar, batang, dan daun.",
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              judulBagian: { type: "string" },
              kalimatSederhana: { type: "string" },
              jumlahKata: { type: "integer" },
            },
            required: ["judulBagian", "kalimatSederhana", "jumlahKata"],
          },
        },
      });

      const teks = response.text ?? "";
      const parsed = JSON.parse(teks) as {
        judulBagian: string;
        kalimatSederhana: string;
        jumlahKata: number;
      };
      console.log("Percobaan " + percobaan + " — LOLOS  JSON valid sesuai schema");
      console.log("  respons       : " + potong(teks, 200));
      console.log("  judulBagian   : " + parsed.judulBagian);
      console.log("  kalimatSederhana: " + parsed.kalimatSederhana);
      return;
    } catch (error) {
      const pesan = error instanceof Error ? error.message : String(error);
      if (/503|UNAVAILABLE|overloaded|high demand/i.test(pesan)) {
        console.log(
          "Percobaan " + percobaan + " — 503 sementara, menunggu 8 detik",
        );
        await new Promise((resolve) => setTimeout(resolve, 8000));
        continue;
      }
      gagal += 1;
      console.log("GAGAL  " + potong(pesan, 400));
      return;
    }
  }
  gagal += 1;
  console.log(
    "GAGAL  model tetap 503 setelah " + percobaanMaks + " percobaan.",
  );
  console.log("       Ini murni beban layanan, bukan masalah kode.");
}

async function cek3DaftarModelGambar() {
  judul("3. Pollinations — daftar model gambar + harga");
  const url = "https://gen.pollinations.ai/image/models";
  const response = await fetch(url);
  console.log("HTTP " + response.status + " " + response.statusText);

  if (!response.ok) {
    console.log("GAGAL  tidak bisa membaca katalog model");
    gagal += 1;
    return;
  }

  // Endpoint ini mengembalikan array JSON telanjang, bukan objek { data: [] }.
  const models = (await response.json()) as {
    name?: string;
    publisher?: string;
    community?: boolean;
    per_user_rpm?: number;
    pricing?: { currency?: string; completionImageTokens?: string };
    health?: { status?: string };
    supported_endpoints?: string[];
  }[];
  const daftar = Array.isArray(models) ? models : [];
  console.log("Total model gambar: " + daftar.length);

  const cocok = daftar.find((item) =>
    (item.name ?? "").toLowerCase() === MODEL_GAMBAR.toLowerCase(),
  );

  console.log("\n" + (cocok ? "LOLOS" : "GAGAL") + '  "' + MODEL_GAMBAR + '"');
  if (cocok) {
    console.log("  penerbit     : " + (cocok.publisher ?? "?"));
    console.log("  komunitas    : " + String(cocok.community));
    console.log("  status       : " + (cocok.health?.status ?? "?"));
    console.log("  rpm per user : " + String(cocok.per_user_rpm ?? "?"));
    console.log(
      "  harga        : " +
        (cocok.pricing?.completionImageTokens ?? "?") +
        " " +
        (cocok.pricing?.currency ?? "?"),
    );
    const adaEndpoint = (cocok.supported_endpoints ?? []).includes(
      "/v1/images/generations",
    );
    console.log(
      (adaEndpoint ? "LOLOS" : "GAGAL") +
        "  endpoint /v1/images/generations tersedia",
    );
    if (!adaEndpoint) gagal += 1;
  } else {
    gagal += 1;
    console.log("  Model tidak ada di katalog. Nama yang memuat 'flux':");
    for (const item of daftar) {
      const nama = item.name ?? "";
      if (/flux/i.test(nama)) {
        console.log(
          "    - " +
            nama +
            "  (" +
            (item.pricing?.completionImageTokens ?? "?") +
            " pollen, " +
            (item.health?.status ?? "?") +
            ")",
        );
      }
    }
  }
}

async function cek4SaldoPollinations() {
  judul("4. Pollinations — saldo Pollen");
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) {
    console.log("GAGAL  POLLINATIONS_API_KEY tidak ada di .env.local");
    gagal += 1;
    return;
  }
  const response = await fetch("https://gen.pollinations.ai/account/balance", {
    headers: { Authorization: "Bearer " + key },
  });
  console.log("HTTP " + response.status + " " + response.statusText);
  const badan = await response.text();
  if (response.ok) {
    console.log("  " + potong(badan, 300));
  } else {
    console.log("  " + potong(badan, 300));
    console.log(
      "  Catatan: 403 di sini belum tentu berarti generate gambar gagal,",
    );
    console.log("  endpoint ini bisa butuh scope tambahan.");
  }
}

async function main() {
  console.log("Verifikasi API — model teks: " + MODEL_TEKS);
  console.log("Verifikasi API — model gambar: " + MODEL_GAMBAR);

  await cek1DaftarModelGemini();
  await cek2UjiStrukturGemini();
  await cek3DaftarModelGambar();
  await cek4SaldoPollinations();

  console.log(
    "\n" +
      (gagal === 0
        ? "SEMUA PEMERIKSAAN LOLOS"
        : gagal + " PEMERIKSAAN GAGAL"),
  );
  process.exit(gagal === 0 ? 0 : 1);
}

void main();
