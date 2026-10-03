"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import { students, studentAccessTokens } from "@/db/schema";
import { defaultTokenExpiry, generateToken, hashToken } from "@/lib/tokens";
import { writeRevealedTokens } from "@/lib/token-reveal";
import type { ActionResult } from "./auth";

const fail = (message: string): ActionResult => ({ ok: false, message });

const inputSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type TokenActionResult = ActionResult & { token?: string };

/**
 * Buat atau rotasi token QR siswa.
 *
 * Teks token hanya dikembalikan sekali, lalu disimpan di cookie terenkripsi
 * milik guru (lihat src/lib/token-reveal.ts). Database hanya menerima
 * hash SHA-256 sesuai PRD Bab 8.
 */
export async function generateTokenAction(
  input: unknown,
): Promise<TokenActionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data kelas atau siswa tidak valid.");
  }
  const { classId, studentId } = parsed.data;

  try {
    const context = await requireAuthContext();
    const plaintext = generateToken();

    const student = await withRlsDb(context.claims, async (tx) => {
      const [studentRow] = await tx
        .select({ name: students.fullName })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);
      if (!studentRow) throw new Error("Siswa tidak ditemukan.");

      await tx
        .delete(studentAccessTokens)
        .where(
          and(
            eq(studentAccessTokens.classId, classId),
            eq(studentAccessTokens.studentId, studentId),
          ),
        );

      await tx.insert(studentAccessTokens).values({
        studentId,
        classId,
        tokenHash: hashToken(plaintext),
        isActive: true,
        expiresAt: defaultTokenExpiry(),
      });

      return studentRow.name;
    });

    await writeRevealedTokens(classId, { [studentId]: plaintext });

    revalidatePath(`/dashboard/kelas/${classId}/qr`);
    revalidatePath(`/dashboard/kelas/${classId}`);
    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard", "layout");

    return {
      ok: true,
      token: plaintext,
      message: `Token QR ${student} dibuat. Cetak atau simpan tautannya sekarang, karena teks token tidak bisa ditampilkan lagi.`,
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Token gagal dibuat.");
  }
}

/** Aktifkan atau nonaktifkan token tanpa membuat token baru. */
export async function toggleTokenAction(input: {
  tokenId: string;
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const rows = await tx
        .update(studentAccessTokens)
        .set({ isActive: input.isActive })
        .where(eq(studentAccessTokens.id, input.tokenId))
        .returning({ classId: studentAccessTokens.classId });
      if (rows.length === 0) throw new Error("Token tidak ditemukan.");
    });

    revalidatePath("/dashboard/kelas", "layout");
    return {
      ok: true,
      message: input.isActive
        ? "Token diaktifkan kembali."
        : "Token dinonaktifkan. QR lama tidak bisa dipakai lagi.",
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Token gagal diubah.");
  }
}

/** Perpanjang masa berlaku token satu tahun ajaran. */
export async function extendTokenAction(tokenId: string): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(studentAccessTokens)
        .set({ expiresAt: defaultTokenExpiry() })
        .where(eq(studentAccessTokens.id, tokenId));
    });

    revalidatePath("/dashboard/kelas", "layout");
    return { ok: true, message: "Masa berlaku token diperpanjang." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Masa berlaku gagal diperpanjang.",
    );
  }
}