import { createHash, randomBytes } from "node:crypto";

/**
 * Token QR siswa.
 *
 * PRD Bab 8: token wajib disimpan sebagai hash SHA-256 dan divalidasi di
 * server. Teks aslinya hanya hidup di memori server pada satu kali pembuatan
 * (reveal-once) lalu diteruskan ke cookie terenkripsi milik guru, bukan ke
 * database.
 */

export const TOKEN_LENGTH = 32;

/** 32 karakter heksadesimal acak (16 byte). */
export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH / 2).toString("hex");
}

/** Hash yang disimpan di kolom `token_hash`. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token.trim().toLowerCase()).digest("hex");
}

export function isTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/** Default masa berlaku token: 1 tahun ajaran (PRD Bab 6E). */
export function defaultTokenExpiry(): string {
  const now = new Date();
  return new Date(now.getFullYear() + 1, now.getMonth(), 0, 23, 59, 59)
    .toISOString()
    .replace(/\.\d{3}Z$/, "+00:00");
}