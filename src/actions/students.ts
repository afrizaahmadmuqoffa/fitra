"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import {
  classStudents,
  materials,
  materialAdaptations,
  notifications,
  students,
  studentProfiles,
} from "@/db/schema";
import { studentFormSchema } from "@/lib/validation";
import type { SkillLevel } from "@/db/types";
import type { ActionResult } from "./auth";

const fail = (message: string): ActionResult => ({ ok: false, message });

function joinNotes(...parts: (string | undefined | null)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

/**
 * Simpan data siswa dari wizard, baik mode menambah maupun menyunting.
 *
 * Ketiga bagian disimpan dalam satu transaksi: identitas (tabel students),
 * profil belajar enam domain (student_profiles), dan keanggotaan kelas
 * (class_students). Karena satu wizard menangani ketiganya, data tidak mungkin
 * tersimpan separuh jalan.
 *
 * Nilai `academicLevel` tidak diambil dari form, melainkan diturunkan dari
 * kemampuan membaca, menulis, dan berhitung supaya tidak ada dua sumber
 * kebenaran untuk hal yang sama.
 */
export async function saveStudentFormAction(input: {
  studentId?: string;
  values: unknown;
}): Promise<ActionResult> {
  const parsed = studentFormSchema.safeParse(input.values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data siswa belum lengkap.");
  }
  const values = parsed.data;
  const isEdit = Boolean(input.studentId);

  const level: SkillLevel =
    values.membaca === "high" || values.menulis === "high" ? "high" : "medium";

  try {
    const context = await requireAuthContext();

    await withRlsDb(context.claims, async (tx) => {
      let studentId = input.studentId ?? "";

      if (studentId) {
        const updated = await tx
          .update(students)
          .set({
            fullName: values.fullName.trim(),
            nickname: values.nickname?.trim() || null,
            age: values.age,
            gender: values.gender,
            disabilityType: values.disabilityType,
            notes: values.notes?.trim() || null,
          })
          .where(eq(students.id, studentId))
          .returning({ id: students.id });
        if (updated.length === 0) throw new Error("Siswa tidak ditemukan.");
      } else {
        const [row] = await tx
          .insert(students)
          .values({
            teacherId: context.userId,
            fullName: values.fullName.trim(),
            nickname: values.nickname?.trim() || null,
            age: values.age,
            gender: values.gender,
            disabilityType: values.disabilityType,
            notes: values.notes?.trim() || null,
          })
          .returning({ id: students.id });
        studentId = row.id;
      }

      const profilePayload = {
        academicLevel: level,
        academicDetails: {
          membaca: values.membaca,
          menulis: values.menulis,
          berhitung: values.berhitung,
          catatan: values.academicNotes || undefined,
        },
        socialEmotional: {
          mengenaliOrang: values.mengenaliOrang,
          bekerjaSama: values.bekerjaSama,
          mengaturEmosi: values.mengaturEmosi,
          catatan: joinNotes(
            values.socialNotes,
            values.strengths.length
              ? `Kekuatan: ${values.strengths.join(", ")}.`
              : "",
            values.barriers.length ? `Kendala: ${values.barriers.join(", ")}.` : "",
          ),
        },
        motorSkills: {
          motorHalus: values.motorHalus,
          motorKasar: values.motorKasar,
          catatan: values.motorNotes || "",
        },
        independence: {
          dressed: values.dressed,
          makan: values.makan,
          menggunakanAlat: values.menggunakanAlat,
          catatan: values.independenceNotes || "",
        },
        learningPreferences: {
          visual: values.preferences.includes("visual"),
          audio: values.preferences.includes("audio"),
          kinestetik: values.preferences.includes("kinestetik"),
        },
        interactionModes: {
          touch: values.interactions.includes("touch"),
          speech: values.interactions.includes("speech"),
          keyboard: values.interactions.includes("keyboard"),
          switch: values.interactions.includes("switch"),
          drag: values.interactions.includes("drag"),
        },
        uiTokens: {
          fontSize: values.fontSize,
          contrastMode: values.contrastMode,
          audioEnabled: values.audioEnabled,
          audioSpeed: values.audioSpeed,
          navStyle: values.navStyle,
        },
        updatedAt: new Date().toISOString(),
      };

      const [existing] = await tx
        .select({ id: studentProfiles.id })
        .from(studentProfiles)
        .where(eq(studentProfiles.studentId, studentId))
        .limit(1);

      if (existing) {
        await tx
          .update(studentProfiles)
          .set(profilePayload)
          .where(eq(studentProfiles.id, existing.id));
      } else {
        await tx.insert(studentProfiles).values({ studentId, ...profilePayload });
      }

      // PENTING: yang dibandingkan adalah id KELAS, bukan id siswa. Kalau kolom
      // ini keliru, semua kelas terpilih dianggap baru dan INSERT menabrak
      // unique index (class_id, student_id).
      const current = await tx
        .select({ classId: classStudents.classId })
        .from(classStudents)
        .where(eq(classStudents.studentId, studentId));
      const currentIds = new Set(current.map((row) => row.classId));
      const nextIds = new Set(values.classIds);

      const removed = [...currentIds].filter((id) => !nextIds.has(id));
      if (removed.length > 0) {
        await tx
          .delete(classStudents)
          .where(
            and(
              eq(classStudents.studentId, studentId),
              inArray(classStudents.classId, removed),
            ),
          );
      }

      const added = [...nextIds].filter((id) => !currentIds.has(id));
      if (added.length > 0) {
        await tx
          .insert(classStudents)
          .values(added.map((classId) => ({ classId, studentId })))
          // Simpan berulang tidak boleh gagal: index unique tetap menjaga data,
          // baris yang sudah ada dilewati diam-diam.
          .onConflictDoNothing();
      }

      // PRD 6.A: perubahan profil otomatis menandai materi yang pernah
      // diterbitkan sebagai perlu ditinjau ulang. Tanpa ini, adaptasi lama
      // masih berjalan padahal cara belajar siswa sudah berubah.
      const [terbit] = await tx
        .select({ id: materials.id, judul: materials.title })
        .from(materials)
        .innerJoin(
          materialAdaptations,
          eq(materialAdaptations.materialId, materials.id),
        )
        .where(
          and(
            eq(materialAdaptations.studentId, studentId),
            eq(materials.status, "published"),
            eq(materials.needsReview, false),
          ),
        )
        .limit(10);

      if (terbit) {
        await tx
          .update(materials)
          .set({ needsReview: true })
          .where(eq(materials.id, terbit.id));

        await tx.insert(notifications).values({
          userId: context.userId,
          title: `Materi untuk ${values.fullName} perlu ditinjau ulang`,
          body: `Profil belajar berubah, sehingga materi "${terbit.judul}" yang sudah terbit mungkin tidak pas lagi.`,
          type: "review",
          link: "/dashboard/materi",
        });
      }
    });

    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard/siswa/baru");
    if (input.studentId) revalidatePath(`/dashboard/siswa/${input.studentId}`);
    if (input.studentId) revalidatePath(`/dashboard/siswa/${input.studentId}/ubah`);
    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard", "layout");

    return {
      ok: true,
      message: isEdit
        ? `${values.fullName.trim()} tersimpan.`
        : `${values.fullName.trim()} berhasil ditambahkan.`,
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Siswa gagal disimpan.");
  }
}

/** Hapus siswa; seluruh data turunannya ikut terhapus (cascade). */
export async function deleteStudentAction(studentId: string): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const deleted = await tx
        .delete(students)
        .where(eq(students.id, studentId))
        .returning({ id: students.id });
      if (deleted.length === 0) throw new Error("Siswa tidak ditemukan.");
    });

    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Siswa dihapus beserta seluruh datanya." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Siswa gagal dihapus.");
  }
}

/** Ganti daftar siswa dalam satu kelas tanpa menyentuh kelas lain. */
export async function setClassStudentsAction(input: {
  classId: string;
  studentIds: string[];
}): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const current = await tx
        .select({ studentId: classStudents.studentId })
        .from(classStudents)
        .where(eq(classStudents.classId, input.classId));
      const currentIds = new Set(current.map((row) => row.studentId));
      const nextIds = new Set(input.studentIds);

      const removed = [...currentIds].filter((id) => !nextIds.has(id));
      if (removed.length > 0) {
        await tx
          .delete(classStudents)
          .where(
            and(
              eq(classStudents.classId, input.classId),
              inArray(classStudents.studentId, removed),
            ),
          );
      }

      const added = [...nextIds].filter((id) => !currentIds.has(id));
      if (added.length > 0) {
        await tx
          .insert(classStudents)
          .values(
            added.map((studentId) => ({ classId: input.classId, studentId })),
          )
          .onConflictDoNothing();
      }
    });

    revalidatePath(`/dashboard/kelas/${input.classId}`);
    revalidatePath(`/dashboard/kelas/${input.classId}/qr`);
    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Anggota kelas tersimpan." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Anggota kelas gagal disimpan.",
    );
  }
}