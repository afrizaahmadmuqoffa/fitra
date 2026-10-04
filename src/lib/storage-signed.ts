import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { debug } from "@/lib/ai/debug";

/**
 * Penyajian berkas dari bucket privat.
 *
 * PRD Bab 8 dan 10: bucket visual-assets bersifat privat dan tidak boleh
 * dibuka lewat URL biasa. Aset disajikan lewat signed URL berdurasi terbatas,
 * dibuat saat dibaca dan tidak disimpan ke database.
 *
 * Masa berlaku sengaja satu jam: cukup untuk render satu halaman, dan membuat
 * tautan yang bocor cepat tidak berguna.
 */
const MASA_VALIDITAS_DETIK = 3600;

/** Tanda tangan satu jalur berkas. Null bila gagal atau jalur kosong. */
export async function tandatangani(jalur: string | null): Promise<string | null> {
  if (!jalur) return null;
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from("visual-assets")
      .createSignedUrl(jalur, MASA_VALIDITAS_DETIK);

    if (error || !data?.signedUrl) {
      debug.peringatan("signed URL gambar gagal dibuat", {
        jalur: jalur,
        galat: error?.message ?? "tidak ada urlsigned",
      });
      return null;
    }
    return data.signedUrl;
  } catch (error) {
    debug.galat("gagal membuat signed URL gambar", {
      jalur: jalur,
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    return null;
  }
}

/**
 * Menandatangani banyak jalur sekaligus dan mengembalikannya sebagai peta.
 *
 * Dipakai agar satu render halaman tidak memicu banyak permintaan storage
 * satu per aset.
 */
export async function tandatamani(
  jalur: (string | null)[],
): Promise<Map<string, string>> {
  const unik = [...new Set(jalur.filter(Boolean))] as string[];
  const hasil = new Map<string, string>();

  if (unik.length === 0) return hasil;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from("visual-assets")
      .createSignedUrls(unik, MASA_VALIDITAS_DETIK);

    if (error || !data) {
      debug.peringatan("signed URL massal gagal dibuat", {
        jumlah: unik.length,
        galat: error?.message ?? "tidak ada urlsigned",
      });
      return hasil;
    }

    for (const item of data) {
      if (item.path && item.signedUrl) hasil.set(item.path, item.signedUrl);
    }

    const gagal = unik.length - hasil.size;
    if (gagal > 0) {
      debug.peringatan("sebagian signed URL gambar tidak terbentuk", {
        berhasil: hasil.size,
        gagal: gagal,
      });
    }
  } catch (error) {
    debug.galat("gagal menandatangani banyak gambar", {
      jumlah: unik.length,
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
  }

  return hasil;
}
