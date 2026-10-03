import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Cookie "reveal session" untuk token QR.
 *
 * Karena PRD mewajibkan database hanya menyimpan hash, teks token tidak bisa
 * diambil ulang dari database. Supaya guru tetap bisa mencetak ulang kartu QR
 * dalam sesi yang sama, token yang baru dibuat disimpan sebentar di cookie
 * terenkripsi milik guru (httpOnly, TTL pendek). Cookie ini bukan database dan
 * tidak pernah dikirim ke halaman siswa.
 */
const COOKIE_NAME = "fitra:token-reveal";
const MAX_AGE_SECONDS = 60 * 60;

export type RevealedTokens = {
  classId: string;
  at: number;
  tokens: Record<string, string>;
};

function getKey(): Buffer {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "QR_TOKEN_SECRET belum diisi. Tambahkan ke .env.local (server-only).",
    );
  }
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: RevealedTokens): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), payload.toString("base64url")].join(".");
}

function decrypt(raw: string): RevealedTokens | null {
  try {
    const [ivPart, tagPart, payloadPart] = raw.split(".");
    if (!ivPart || !tagPart || !payloadPart) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getKey(),
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(payloadPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(plain) as RevealedTokens;
    if (!parsed || typeof parsed !== "object" || !parsed.tokens) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Token yang baru dibuat pada sesi guru ini, dikunci per kelas. */
export async function readRevealedTokens(
  classId?: string,
): Promise<Record<string, string>> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return {};
  const payload = decrypt(raw);
  if (!payload) return {};
  if (Date.now() - payload.at > MAX_AGE_SECONDS * 1000) return {};
  if (classId && payload.classId !== classId) return {};
  return payload.tokens;
}

/** Dipakai di Server Action setelah token dibuat atau dirotasi. */
export async function writeRevealedTokens(
  classId: string,
  tokens: Record<string, string>,
): Promise<void> {
  const store = await cookies();
  const existing = await readRevealedTokens(classId);
  const merged = { ...existing, ...tokens };
  store.set(COOKIE_NAME, encrypt({ classId, at: Date.now(), tokens: merged }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}