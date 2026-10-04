"use server";

/**
 * Tiket unggah berkas.
 *
 * PRD Bab 6B memperbolehkan berkas sampai 20 MB, sedangkan request Server
 * Action hanya boleh 1 MB. Solusinya: berkas tidak pernah melewati server
 * Next.js. Guru meminta tiket, lalu browser mengunggah langsung ke Supabase
 * Storage memakai tiket tersebut.
 *
 * Kontrak keamanan yang dipegang berkas ini:
 * - Bucket DIPATOK di server. Klien tidak boleh memilih bucket, sehingga
 *   seorang guru tidak bisa mendapat tiket untuk menulis ke bucket lain.
 * - Path memakai id guru dan UUID, sehingga tidak bisa ditebak orang lain.
 * - Setiap masukan divalidasi Zod sebelum tiket terbit (PRD Bab 8).
 * - Tidak ada policy RLS untuk storage.objects. Otorisasi diberikan oleh tiket
 *   yang diterbitkan service role, dan unggah tanpa tiket otomatis ditolak
 *   oleh Postgres. Ini sudah diverifikasi di scripts/cek-upload-tiket.ts.
 */
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { debug } from "@/lib/ai/debug";
import type { ActionResult } from "./auth";

/** Hanya bucket ini yang boleh dipakai unggah materi. */
const BUCKET_MATERI = "materials";

/** PRD Bab 6B: 20 MB. */
const MAKS_BYTES = 20 * 1024 * 1024;

/** Tipe yang diterima bucket materials. */
const TIPE_DITERIMA: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const tiketInput = z.object({
  fileName: z
    .string()
    .min(3, "Nama berkas terlalu pendek.")
    .max(180, "Nama berkas terlalu panjang."),
  sizeBytes: z
    .number()
    .int()
    .positive("Ukuran berkas tidak valid.")
    .max(MAKS_BYTES, "Ukuran berkas melebihi 20 MB."),
});

/** Buang karakter yang tidak aman untuk nama berkas di storage. */
function namaAman(nama: string): string {
  return nama
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(-80);
}

export type HasilTiket = {
  path: string;
  token: string;
};

/**
 * Minta tiket unggah satu berkas.
 *
 * Tiket hanya berlaku singkat dan hanya untuk satu path, jadi setelah langkah
 * unggah selesai, tiket tidak bisa dipakai ulang.
 */
export async function createUploadTicketAction(
  input: unknown,
): Promise<ActionResult & { tiket?: HasilTiket; contentType?: string }> {
  const parsed = tiketInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Berkas tidak valid.",
    };
  }

  const ekstensi = parsed.data.fileName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = TIPE_DITERIMA[ekstensi];

  if (!contentType) {
    return {
      ok: false,
      message: "Format berkas harus PDF, DOCX, atau TXT.",
    };
  }

  let context;
  try {
    context = await requireAuthContext();
  } catch {
    return { ok: false, message: "Sesi guru tidak ditemukan. Silakan masuk kembali." };
  }

  const path = `materi/${context.userId}/${crypto.randomUUID()}-${namaAman(parsed.data.fileName)}`;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_MATERI)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data?.token) {
      debug.galat("gagal membuat tiket unggah", {
        guru: context.userId,
        galat: error?.message ?? "tanpa token",
      });
      return {
        ok: false,
        message: "Tiket unggah gagal dibuat. Coba lagi beberapa saat lagi.",
      };
    }

    debug.info("tiket unggah diterbitkan", {
      guru: context.userId,
      path: data.path,
      ukuran_kb: Math.round(parsed.data.sizeBytes / 1024),
    });

    return {
      ok: true,
      message: "Tiket unggah siap.",
      tiket: { path: data.path, token: data.token },
      contentType,
    };
  } catch (error) {
    debug.galat("tiket unggah melempar galat", {
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    return {
      ok: false,
      message: "Tiket unggah gagal dibuat. Coba lagi beberapa saat lagi.",
    };
  }
}

/**
 * Menghapus berkas yang sudah terunggah tetapi materi gagal disimpan.
 *
 * Tanpa ini, berkas yatim akan menumpuk di bucket dan memakan kuota guru.
 * Path harus berawalan materi/{id guru} milik pemanggil, jadi seorang guru
 * tidak bisa menghapus berkas guru lain.
 */
export async function discardUploadedFileAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = z
    .object({ path: z.string().min(10).max(300) })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Jalur berkas tidak valid." };
  }

  try {
    const context = await requireAuthContext();
    const prefiks = `materi/${context.userId}/`;

    if (!parsed.data.path.startsWith(prefiks)) {
      debug.peringatan("percobaan hapus berkas milik guru lain", {
        prefiks_diminta: parsed.data.path.slice(0, 40),
      });
      return { ok: false, message: "Berkas tidak ditemukan." };
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.storage
      .from(BUCKET_MATERI)
      .remove([parsed.data.path]);

    if (error) {
      debug.peringatan("berkas yatim gagal dihapus", {
        galat: error.message,
      });
      return { ok: false, message: "Berkas belum bisa dihapus." };
    }

    return { ok: true, message: "Berkas dibuang." };
  } catch (error) {
    debug.galat("gagal membuang berkas yatim", {
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    return { ok: false, message: "Berkas belum bisa dihapus." };
  }
}
