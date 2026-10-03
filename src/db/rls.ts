/**
 * RLS ditegakkan oleh Postgres, bukan oleh filter di kode.
 *
 * Pola ini mengikuti panduan resmi Drizzle untuk Supabase: setiap unit kerja
 * guru dibungkus transaksi yang
 *   1. menulis JWT ke `request.jwt.claims` dan `request.jwt.claim.sub`,
 *   2. menurunkan privilege koneksi ke role `authenticated`,
 *   3. menjalankan query sebagai pengguna tersebut.
 * Karena policy memakai `auth.uid()`, baris milik guru lain otomatis tidak
 * terlihat dan tidak bisa diubah.
 *
 * Jalur siswa (`/belajar/*`) memakai `withServiceDb`, karena siswa tidak punya
 * akun. Gating-nya murni server-side: token QR di-hash SHA-256 lalu dicari di
 * `student_access_tokens`.
 */
import { sql } from "drizzle-orm";
import { getDb } from "./client";

export type RlsTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export type AuthClaims = {
  sub: string;
  email?: string;
};

/** Query sebagai guru yang sedang login (RLS aktif). */
export async function withRlsDb<T>(
  claims: AuthClaims | null,
  fn: (tx: RlsTx) => Promise<T>,
): Promise<T> {
  if (!claims?.sub) {
    throw new Error("Sesi guru tidak ditemukan. Silakan masuk kembali.");
  }
  const db = getDb();
  return db.transaction(async (tx) => {
    const payload = {
      sub: claims.sub,
      email: claims.email ?? null,
      role: "authenticated",
      aud: "authenticated",
      iss: "supabase",
    };
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(payload)}, true)`,
    );
    await tx.execute(sql`select set_config('request.jwt.claim.sub', ${claims.sub}, true)`);
    await tx.execute(sql.raw("set local role authenticated"));
    return fn(tx);
  });
}

/** Query service-role untuk jalur siswa dan operasi internal server. */
export async function withServiceDb<T>(fn: (tx: RlsTx) => Promise<T>): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql.raw("set local role service_role"));
    return fn(tx);
  });
}