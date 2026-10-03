/**
 * Pesan error yang bisa dibaca guru.
 *
 * Server Action bisa menolak (jaringan putus, server sedang sibuk, atau env
 * server belum lengkap). Tanpa helper ini, penolakan itu membuat tombol
 * terkunci di keadaan loading karena `setPending(false)` tidak pernah jalan.
 */
export function pesanError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch")) {
      return "Koneksi ke server terputus. Periksa jaringan Anda lalu coba lagi.";
    }
    if (error.message.includes("DATABASE_URL")) {
      return "Server belum siap menerima data. Hubungi pengelola aplikasi.";
    }
    if (error.message.includes("use server")) {
      return "Ada kesalahan konfigurasi di server. Hubungi pengelola aplikasi.";
    }
    return error.message.slice(0, 180);
  }
  return "Terjadi kesalahan yang tidak terduga. Coba lagi beberapa saat.";
}

/** Jalankan Server Action tanpa risiko tombol terkunci atau error diam-diam. */
export async function jalankanAction<T extends { ok: boolean; message: string }>(
  aksi: () => Promise<T>,
): Promise<T> {
  try {
    return await aksi();
  } catch (error) {
    return { ok: false, message: pesanError(error) } as T;
  }
}