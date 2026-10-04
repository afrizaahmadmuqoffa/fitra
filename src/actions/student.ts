"use server";

/**
 * Server Action untuk area siswa `/belajar/*`.
 *
 * Keamanan adalah alasan utama berkas ini ada. Siswa tidak punya akun dan
 * tidak punya sesi login, jadi tidak ada JWT guru yang bisa dipakai sebagai
 * penanda identitas. Tanpa gerbang tambahan, siapa pun yang mengarang
 * studentId bisa memalsukan progres. Karena itu SETIAP aksi di sini:
 *   1. hash token QR yang dikirim,
 *   2. mencari baris token di student_access_tokens,
 *   3. memakai studentId dari baris itu, bukan dari masukan pemanggil,
 *   4. memastikan sesi yang ditulis milik siswa tersebut.
 *
 * Query memakai service_role karena RLS tidak bisa membedakan siswa. Gerbang
 * di atas yang menggantikannya (PRD Bab 8).
 */
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { withServiceDb } from "@/db/rls";
import {
  learningSessions,
  notifications,
  progressRecords,
  studentAccessTokens,
  students,
} from "@/db/schema";
import { hashToken, isTokenExpired } from "@/lib/tokens";
import { debug } from "@/lib/ai/debug";
import type { ActionResult } from "./auth";

const gagal = (pesan: string): ActionResult => ({ ok: false, message: pesan });

const tokenInput = z.object({
  token: z.string().min(8, "Token tidak dikenali.").max(80),
});

const mulaiInput = tokenInput.extend({
  adaptationId: z.string().uuid("Materi tidak dikenali."),
});

const jawabInput = tokenInput.extend({
  sessionId: z.string().uuid("Sesi tidak dikenali."),
  sectionIndex: z.number().int().min(0),
  interactionType: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z_]+$/, "Jenis interaksi tidak dikenali."),
  response: z.string().max(500, "Jawaban terlalu panjang."),
  isCorrect: z.boolean().nullable(),
  timeSpentSeconds: z.number().int().min(0).max(86_400),
});

const selesaiInput = tokenInput.extend({
  sessionId: z.string().uuid("Sesi tidak dikenali."),
  durationSeconds: z.number().int().min(0).max(86_400),
});

/**
 * Gerbang token. Mengembalikan identitas siswa hasil lookup, bukan dari
 * masukan pemanggil. Null berarti token tidak boleh dipakai.
 */
async function gerbangSiswa(
  token: string,
): Promise<{ studentId: string; classId: string } | null> {
  const tokenHash = hashToken(token);

  return withServiceDb(async (tx) => {
    const [baris] = await tx
      .select({
        id: studentAccessTokens.id,
        studentId: studentAccessTokens.studentId,
        classId: studentAccessTokens.classId,
        isActive: studentAccessTokens.isActive,
        expiresAt: studentAccessTokens.expiresAt,
      })
      .from(studentAccessTokens)
      .where(eq(studentAccessTokens.tokenHash, tokenHash))
      .limit(1);

    if (!baris) {
      debug.peringatan("token QR tidak dikenal", { ada: false });
      return null;
    }
    if (!baris.isActive) {
      debug.peringatan("token QR nonaktif dipakai", { student: baris.studentId });
      return null;
    }
    if (isTokenExpired(baris.expiresAt)) {
      debug.peringatan("token QR kedaluwarsa dipakai", { student: baris.studentId });
      return null;
    }

    await tx
      .update(studentAccessTokens)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(studentAccessTokens.id, baris.id));

    return { studentId: baris.studentId, classId: baris.classId };
  });
}

/**
 * Memulai sesi belajar saat siswa membuka materi (PRD 6.F).
 *
 * Idempoten per siswa dan adaptasi: membuka halaman dua kali tidak membuat
 * dua sesi, karena halaman sering dimuat ulang.
 */
export async function startLearningSessionAction(
  input: unknown,
): Promise<ActionResult & { sessionId?: string }> {
  const parsed = mulaiInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Permintaan tidak valid.");
  }

  const akses = await gerbangSiswa(parsed.data.token);
  if (!akses) {
    return gagal("Akses belajar tidak berlaku. Pindai ulang kode QR dari guru.");
  }

  try {
    const sessionId = await withServiceDb(async (tx) => {
      // Sesi yang masih terbuka untuk materi yang sama dipakai ulang.
      const [terbuka] = await tx
        .select({ id: learningSessions.id })
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.studentId, akses.studentId),
            eq(learningSessions.materialAdaptationId, parsed.data.adaptationId),
          ),
        )
        .orderBy(learningSessions.startedAt)
        .limit(1);

      if (terbuka) {
        debug.info("sesi belajar dipakai ulang", {
          student: akses.studentId,
          sesi: terbuka.id,
        });
        return terbuka.id;
      }

      const [baru] = await tx
        .insert(learningSessions)
        .values({
          studentId: akses.studentId,
          classId: akses.classId,
          materialAdaptationId: parsed.data.adaptationId,
        })
        .returning({ id: learningSessions.id });

      debug.info("sesi belajar dimulai", {
        student: akses.studentId,
        sesi: baru.id,
      });
      return baru.id;
    });

    return { ok: true, sessionId, message: "Sesi belajar dimulai." };
  } catch (error) {
    debug.galat("gagal memulai sesi", {
      student: akses.studentId,
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    return gagal("Sesi belajar belum bisa dimulai.");
  }
}

/**
 * Mencatat satu jawaban siswa ke progress_records (PRD 6.G).
 *
 * Sesi diverifikasi milik siswa dari gerbang token, jadi studentId selalu
 * berasal dari token, tidak pernah dari masukan pemanggil.
 */
export async function recordProgressAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = jawabInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Jawaban tidak valid.");
  }

  const akses = await gerbangSiswa(parsed.data.token);
  if (!akses) {
    return gagal("Akses belajar tidak berlaku. Pindai ulang kode QR dari guru.");
  }

  try {
    await withServiceDb(async (tx) => {
      const [sesi] = await tx
        .select({ id: learningSessions.id })
        .from(learningSessions)
        .where(
          and(
            eq(learningSessions.id, parsed.data.sessionId),
            eq(learningSessions.studentId, akses.studentId),
          ),
        )
        .limit(1);

      // Sesi milik siswa lain berarti permintaan dipalsukan.
      if (!sesi) {
        debug.galat("percobaan menulis progres pada sesi orang lain", {
          sesi: parsed.data.sessionId,
          student: akses.studentId,
        });
        throw new Error("Sesi tidak ditemukan untuk siswa ini.");
      }

      await tx.insert(progressRecords).values({
        sessionId: parsed.data.sessionId,
        studentId: akses.studentId,
        sectionIndex: parsed.data.sectionIndex,
        interactionType: parsed.data.interactionType,
        response: parsed.data.response,
        isCorrect: parsed.data.isCorrect,
        timeSpentSeconds: parsed.data.timeSpentSeconds,
      });
    });

    return { ok: true, message: "Jawaban tersimpan." };
  } catch (error) {
    debug.galat("gagal menyimpan jawaban", {
      student: akses.studentId,
      section: parsed.data.sectionIndex,
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    return gagal("Jawaban belum bisa disimpan.");
  }
}

/** Menutup sesi belajar dan menghitung durasi (PRD 3.5). */
export async function completeLearningSessionAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = selesaiInput.safeParse(input);
  if (!parsed.success) {
    return gagal(parsed.error.issues[0]?.message ?? "Permintaan tidak valid.");
  }

  const akses = await gerbangSiswa(parsed.data.token);
  if (!akses) {
    return gagal("Akses belajar tidak berlaku.");
  }

  try {
    await withServiceDb(async (tx) => {
      const [sesi] = await tx
        .select({
          id: learningSessions.id,
          adaptasiId: learningSessions.materialAdaptationId,
          teacherId: students.teacherId,
          namaSiswa: students.fullName,
        })
        .from(learningSessions)
        .innerJoin(students, eq(students.id, learningSessions.studentId))
        .where(
          and(
            eq(learningSessions.id, parsed.data.sessionId),
            eq(learningSessions.studentId, akses.studentId),
          ),
        )
        .limit(1);

      // Sesi milik siswa lain berarti permintaan dipalsukan.
      if (!sesi) {
        debug.galat("percobaan menutup sesi orang lain", {
          sesi: parsed.data.sessionId,
          student: akses.studentId,
        });
        throw new Error("Sesi tidak ditemukan untuk siswa ini.");
      }

      await tx
        .update(learningSessions)
        .set({
          completedAt: new Date().toISOString(),
          durationSeconds: parsed.data.durationSeconds,
        })
        .where(eq(learningSessions.id, parsed.data.sessionId));

      const [jumlah] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(progressRecords)
        .where(eq(progressRecords.sessionId, parsed.data.sessionId));

      const [benar] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(progressRecords)
        .where(
          and(
            eq(progressRecords.sessionId, parsed.data.sessionId),
            eq(progressRecords.isCorrect, true),
          ),
        );

      // PRD 6.J: guru diberi tahu saat siswa menyelesaikan sesi.
      await tx.insert(notifications).values({
        userId: sesi.teacherId,
        title: `${sesi.namaSiswa} menyelesaikan sesi belajar`,
        body: `${Math.round(parsed.data.durationSeconds / 60)} menit, ${jumlah?.total ?? 0} interaksi, ${benar?.total ?? 0} jawaban tepat.`,
        type: "session",
        link: `/dashboard/progres/${akses.studentId}`,
      });

      debug.info("sesi belajar selesai", {
        student: akses.studentId,
        sesi: parsed.data.sessionId,
        durasi_detik: parsed.data.durationSeconds,
        interaksi: jumlah?.total ?? 0,
        benar: benar?.total ?? 0,
      });
    });

    revalidatePath(`/dashboard/progres/${akses.studentId}`);
    return { ok: true, message: "Sesi belajar selesai." };
  } catch (error) {
    debug.galat("gagal menutup sesi", {
      student: akses.studentId,
      pesan: debug.cuplik(
        error instanceof Error ? error.message : String(error),
      ),
    });
    return gagal("Sesi belajar belum bisa ditutup.");
  }
}
