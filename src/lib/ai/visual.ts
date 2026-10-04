/**
 * Generating ilustrasi dengan Pollinations AI.
 *
 * Alur satu gambar, sesuai keputusan proyek:
 * 1. cek idempotency lewat sidik jari prompt
 * 2. minta URL gambar ke Pollinations
 * 3. unduh berkas dari URL itu di server
 * 4. unggah ke bucket privat visual-assets
 * 5. kembalikan jalur penyimpanan, bukan URL provider
 *
 * PRD Bab 3.2: adaptedContent hanya menyimpan rujukan ke aset. URL provider
 * tidak pernah jadi sumber kebenaran karena bisa kedaluwarsa.
 */
import { createHash } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { debug } from "./debug";

const DASAR = process.env.POLLINATIONS_IMAGE_BASE_URL ?? "https://gen.pollinations.ai";
const MODEL_GAMBAR =
  process.env.POLLINATIONS_IMAGE_MODEL ?? "black-forest-labs/flux.1-schnell";
const PERCOBAAN_MAKS = 3;
const TIMEOUT_MS = 90_000;

export class VisualError extends Error {
  readonly kode: string;

  constructor(pesan: string, kode: string) {
    super(pesan);
    this.name = "VisualError";
    this.kode = kode;
  }
}

/** Sidik jari prompt, dipakai sebagai kunci idempotency. */
export function sidikJariPrompt(prompt: string): string {
  return createHash("sha256")
    .update(prompt.trim().toLowerCase())
    .digest("hex");
}

function tunggu(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Menebak tipe berkas dari awal byte berkas, bukan dari ekstensi URL.
 * URL dari provider tidak Guarantee apa pun soal format.
 */
function sniffingTipe(byte: Uint8Array): {
  mimeType: string;
  ekstensi: string;
} | null {
  if (byte.length > 8 && byte[0] === 0x89 && byte[1] === 0x50 && byte[2] === 0x4e) {
    return { mimeType: "image/png", ekstensi: "png" };
  }
  if (byte.length > 3 && byte[0] === 0xff && byte[1] === 0xd8) {
    return { mimeType: "image/jpeg", ekstensi: "jpg" };
  }
  if (
    byte.length > 12 &&
    byte[0] === 0x52 &&
    byte[1] === 0x49 &&
    byte[2] === 0x46 &&
    byte[3] === 0x46
  ) {
    return { mimeType: "image/webp", ekstensi: "webp" };
  }
  return null;
}

function terjemahkanStatus(status: number, badan: string): VisualError {
  if (status === 401 || status === 403) {
    return new VisualError(
      "Kunci API Pollinations ditolak. Periksa POLLINATIONS_API_KEY di pengaturan lingkungan.",
      "kunci-ditolak",
    );
  }
  if (status === 402) {
    return new VisualError(
      "Saldo Pollinations habis. Isi ulang di enter.pollinations.ai lalu coba lagi.",
      "saldo-habis",
    );
  }
  if (status === 429) {
    return new VisualError(
      "Terlalu banyak permintaan ke layanan gambar. Tunggu sebentar lalu coba lagi.",
      "terlalu-banyak",
    );
  }
  if (status === 404) {
    return new VisualError(
      "Model gambar tidak tersedia. Periksa nama model di pengaturan lingkungan.",
      "model-tak-ada",
    );
  }
  return new VisualError(
    `Layanan gambar gagal dengan status ${status}. ${debug.cuplik(badan)}`,
    "layanan-gagal",
  );
}

type OpsiBuatVisual = {
  /** Prompt lengkap dalam Bahasa Indonesia yang sudah disusun AI. */
  prompt: string;
  adaptationId: string;
  sectionIndex: number;
  /** Lebar gambar yang diminta. */
  width?: number;
  height?: number;
};

export type HasilVisual = {
  storagePath: string;
  mimeType: string;
  sourceHash: string;
  ukuranBytes: number;
};

/**
 * Membuat satu ilustrasi lalu menyimpannya ke bucket privat.
 *
 * Tidak pernah melempar error yang tidak terbaca guru: setiap kegagalan
 * diterjemahkan ke pesan berbahasa Indonesia beserta kode.
 */
export async function buatVisual(opsi: OpsiBuatVisual): Promise<HasilVisual> {
  const prompt = opsi.prompt.trim();
  if (!prompt) {
    throw new VisualError("Prompt gambar kosong.", "prompt-kosong");
  }

  const sidik = sidikJariPrompt(prompt);
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    throw new VisualError(
      "Fitra belum dikonfigurasi untuk membuat gambar. Isi POLLINATIONS_API_KEY di pengaturan lingkungan.",
      "kunci-hilang",
    );
  }

  debug.info("minta gambar ke Pollinations", {
    model: MODEL_GAMBAR,
    panjang_prompt: prompt.length,
    sidik_prompt: sidik.slice(0, 12),
    section: opsi.sectionIndex,
  });

  const urlGambar = await mintaUrlGambar({ prompt, apiKey, width: opsi.width, height: opsi.height });

  debug.info("gambar diterima dari provider", {
    url: debug.cuplik(urlGambar),
  });

  const byteGambar = await unduhGambar(urlGambar);
  const tipe = sniffingTipe(byteGambar);
  if (!tipe) {
    throw new VisualError(
      "Berkas gambar dari provider tidak dikenali. Tidak disimpan.",
      "format-tak-dikenal",
    );
  }

  const storagePath = `adaptasi/${opsi.adaptationId}/bagian-${opsi.sectionIndex}-${sidik.slice(0, 8)}.${tipe.ekstensi}`;

  const supabase = createSupabaseServiceClient();
  const { error: galatUnggah } = await supabase.storage
    .from("visual-assets")
    .upload(storagePath, byteGambar, {
      contentType: tipe.mimeType,
      upsert: true,
    });

  if (galatUnggah) {
    debug.galat("unggah gambar ke storage gagal", {
      jalur: storagePath,
      galat: galatUnggah.message,
    });
    throw new VisualError(
      "Gambar sudah dibuat tetapi gagal disimpan. Coba lagi.",
      "unggah-gagal",
    );
  }

  debug.info("gambar tersimpan", {
    jalur: storagePath,
    tipe: tipe.mimeType,
    ukuran: byteGambar.byteLength,
  });

  return {
    storagePath,
    mimeType: tipe.mimeType,
    sourceHash: sidik,
    ukuranBytes: byteGambar.byteLength,
  };
}

async function mintaUrlGambar(input: {
  prompt: string;
  apiKey: string;
  width?: number;
  height?: number;
}): Promise<string> {
  const url = `${DASAR}/v1/images/generations`;
  const badan = {
    model: MODEL_GAMBAR,
    prompt: input.prompt,
    response_format: "url" as const,
    n: 1,
  };

  let galatTerakhir: unknown = null;

  for (let percobaan = 1; percobaan <= PERCOBAAN_MAKS; percobaan += 1) {
    const mulai = Date.now();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(badan),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const teks = await response.text();

      if (!response.ok) {
        const galat = terjemahkanStatus(response.status, teks);
        debug.peringatan("provider gambar menolak permintaan", {
          percobaan: percobaan,
          status: response.status,
          kode: galat.kode,
          galat: debug.cuplik(teks),
        });
        // Galat yang perlu diulang: 429 dan 5xx.
        const bisaDiulang = response.status === 429 || response.status >= 500;
        if (!bisaDiulang || percobaan === PERCOBAAN_MAKS) throw galat;
        const jeda = 2000 * (2 ** percobaan);
        debug.info("menunggu sebelum mencoba lagi", { jeda_ms: jeda });
        await tunggu(jeda);
        continue;
      }

      const hasil = JSON.parse(teks) as { data?: { url?: string }[] };
      const alamat = hasil.data?.[0]?.url;
      if (!alamat) {
        debug.galat("provider tidak mengembalikan URL gambar", {
          percobaan: percobaan,
          awalan_respons: debug.cuplik(teks),
        });
        throw new VisualError(
          "Layanan gambar tidak mengembalikan gambar. Coba lagi.",
          "respons-tanpa-url",
        );
      }

      debug.info("panggilan provider sukses", {
        percobaan: percobaan,
        durasi_ms: Date.now() - mulai,
      });
      return alamat;
    } catch (error) {
      if (error instanceof VisualError && error.kode !== "terlalu-banyak") {
        throw error;
      }
      galatTerakhir = error;
      if (percobaan < PERCOBAAN_MAKS) {
        await tunggu(2000 * (2 ** percobaan));
        continue;
      }
    }
  }

  const pesan =
    galatTerakhir instanceof Error ? galatTerakhir.message : String(galatTerakhir);
  debug.galat("gagal membuat gambar", { galat: debug.cuplik(pesan) });
  if (galatTerakhir instanceof VisualError) throw galatTerakhir;
  throw new VisualError("Layanan gambar gagal merespons. Coba lagi.", "tidak-diketahui");
}

async function unduhGambar(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    debug.galat("unduh berkas gambar gagal", {
      status: response.status,
      url: debug.cuplik(url),
    });
    throw new VisualError(
      "Gambar tidak bisa diunduh dari penyedia. Coba lagi.",
      "unduh-gagal",
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

/** Nama model gambar yang sedang dipakai, untuk ditampilkan di log. */
export const MODEL_GAMBAR_AKTIF = MODEL_GAMBAR;
