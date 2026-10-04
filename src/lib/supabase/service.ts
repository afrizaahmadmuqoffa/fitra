import { createClient } from "@supabase/supabase-js";

/**
 * Klien Supabase dengan service role. KHASUS SERVER.
 *
 * Dipakai untuk dua hal yang tidak boleh dilakukan oleh kunci anon:
 * - menulis berkas ke bucket privat, karena belum ada policy RLS untuk
 *   storage.objects;
 * - membaca baris milik siswa pada halaman yang tidak punya sesi login,
 *   misalnya halaman belajar yang hanya memegang token QR.
 *
 * Service role melewati RLS, jadi setiap pemakaian WAJIB dibatasi lebih dulu
 * oleh validasi di lapisan pemanggil (token QR atau sesi guru). Jangan
 * pernah mengembalikan klien ini ke komponen klien.
 *
 * Penjaga di bawah sengaja ditulis tanpa paket "server-only" supaya berkas
 * ini tetap bisa diuji dari skrip Node, sekaligus tetap gagal keras kalau
 * ikut terbawa ke peramban.
 */
export function createSupabaseServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "Klien service role hanya boleh dipanggil di server. Kunci itu tidak boleh masuk peramban.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Konfigurasi Supabase service role belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
