"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import { classStudents, students, studentProfiles } from "@/db/schema";
import {
  disabilityTypeSchema,
  skillLevelSchema,
} from "@/lib/validation";
import type { SkillLevel } from "@/db/types";
import type { ActionResult } from "./auth";

const fail = (message: string): ActionResult => ({ ok: false, message });

const preferenceSchema = z.enum(["visual", "audio", "kinestetik"]);
const interactionSchema = z.enum(["touch", "speech", "keyboard", "switch", "drag"]);
const navStyleSchema = z.enum(["step", "scroll", "tap"]);
const audioSpeedSchema = z.enum(["slow", "normal", "fast"]);

export const studentCreateSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter").max(80),
  nickname: z.string().max(24).optional().or(z.literal("")),
  age: z.number().int().min(3, "Usia minimal 3 tahun").max(25, "Usia maksimal 25 tahun"),
  gender: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  disabilityType: disabilityTypeSchema,
  classIds: z.array(z.string().uuid()),
  notes: z.string().max(400).optional().or(z.literal("")),
  academicLevel: skillLevelSchema,
  preferences: z.array(preferenceSchema).min(1, "Pilih minimal satu preferensi belajar"),
  interactions: z
    .array(interactionSchema)
    .min(1, "Pilih minimal satu bentuk interaksi"),
  fontSize: skillLevelSchema,
  contrastMode: z.enum(["normal", "high"]),
  audioEnabled: z.boolean(),
  audioSpeed: audioSpeedSchema,
  navStyle: navStyleSchema,
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const studentProfileFormSchema = z.object({
  membaca: skillLevelSchema,
  menulis: skillLevelSchema,
  berhitung: skillLevelSchema,
  academicNotes: z.string().max(600).optional().or(z.literal("")),
  mengenaliOrang: skillLevelSchema,
  bekerjaSama: skillLevelSchema,
  mengaturEmosi: skillLevelSchema,
  socialNotes: z.string().max(600).optional().or(z.literal("")),
  motorHalus: skillLevelSchema,
  motorKasar: skillLevelSchema,
  motorNotes: z.string().max(600).optional().or(z.literal("")),
  dressed: skillLevelSchema,
  makan: skillLevelSchema,
  menggunakanAlat: skillLevelSchema,
  independenceNotes: z.string().max(600).optional().or(z.literal("")),
  preferences: z.array(preferenceSchema).min(1, "Pilih minimal satu preferensi belajar"),
  interactions: z
    .array(interactionSchema)
    .min(1, "Pilih minimal satu bentuk interaksi"),
  fontSize: skillLevelSchema,
  contrastMode: z.enum(["normal", "high"]),
  audioEnabled: z.boolean(),
  audioSpeed: audioSpeedSchema,
  navStyle: navStyleSchema,
  strengths: z.array(z.string().max(60)).max(12),
  barriers: z.array(z.string().max(60)).max(12),
});

export type StudentProfileFormInput = z.infer<typeof studentProfileFormSchema>;

function joinNotes(...parts: (string | undefined | null)[]): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

/** Tambah siswa baru beserta profil belajar awal dan keanggotaan kelas. */
export async function createStudentAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = studentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data siswa belum lengkap.");
  }
  const values = parsed.data;

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
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

      await tx.insert(studentProfiles).values({
        studentId: row.id,
        academicLevel: values.academicLevel,
        academicDetails: {
          membaca: values.academicLevel,
          menulis: values.academicLevel,
          berhitung: values.academicLevel,
        },
        socialEmotional: {
          mengenaliOrang: values.academicLevel,
          bekerjaSama: values.academicLevel,
          mengaturEmosi: values.academicLevel,
          catatan: "Pemetaan awal saat siswa ditambahkan.",
        },
        motorSkills: {
          motorHalus: values.academicLevel,
          motorKasar: values.academicLevel,
          catatan: "",
        },
        independence: {
          dressed: values.academicLevel,
          makan: values.academicLevel,
          menggunakanAlat: values.academicLevel,
          catatan: "",
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
      });

      if (values.classIds.length > 0) {
        await tx.insert(classStudents).values(
          values.classIds.map((classId) => ({ classId, studentId: row.id })),
        );
      }
    });

    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard/siswa/baru");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: `${values.fullName} berhasil ditambahkan.` };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Siswa gagal disimpan.",
    );
  }
}

/** Simpan hasil pemetaan profil belajar lengkap. */
export async function saveStudentProfileAction(input: {
  studentId: string;
  values: unknown;
}): Promise<ActionResult> {
  const parsed = studentProfileFormSchema.safeParse(input.values);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Profil belajar belum lengkap.",
    );
  }
  const values = parsed.data;
  const level: SkillLevel =
    values.membaca === "high" || values.menulis === "high" ? "high" : "medium";

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      const [existing] = await tx
        .select({ id: studentProfiles.id })
        .from(studentProfiles)
        .where(eq(studentProfiles.studentId, input.studentId))
        .limit(1);

      const payload = {
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
            values.strengths.length ? `Kekuatan: ${values.strengths.join(", ")}.` : "",
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

      if (existing) {
        await tx
          .update(studentProfiles)
          .set(payload)
          .where(eq(studentProfiles.id, existing.id));
      } else {
        await tx.insert(studentProfiles).values({
          studentId: input.studentId,
          ...payload,
        });
      }
    });

    revalidatePath(`/dashboard/siswa/${input.studentId}`);
    revalidatePath(`/dashboard/siswa/${input.studentId}/profil`);
    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Profil belajar tersimpan." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Profil gagal disimpan.",
    );
  }
}

/** Ubah identitas siswa. */
export async function updateStudentIdentityAction(input: {
  studentId: string;
  values: unknown;
}): Promise<ActionResult> {
  const parsed = studentCreateSchema
    .pick({ fullName: true, nickname: true, age: true, gender: true, disabilityType: true, notes: true })
    .safeParse(input.values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data siswa belum lengkap.");
  }
  const values = parsed.data;

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(students)
        .set({
          fullName: values.fullName.trim(),
          nickname: values.nickname?.trim() || null,
          age: values.age,
          gender: values.gender,
          disabilityType: values.disabilityType,
          notes: values.notes?.trim() || null,
        })
        .where(eq(students.id, input.studentId));
    });

    revalidatePath(`/dashboard/siswa/${input.studentId}`);
    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Identitas siswa tersimpan." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Identitas gagal disimpan.",
    );
  }
}

/** Hapus siswa; seluruh data turunannya ikut terhapus (cascade). */
export async function deleteStudentAction(studentId: string): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx.delete(students).where(eq(students.id, studentId));
    });

    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Siswa dihapus beserta seluruh datanya." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Siswa gagal dihapus.",
    );
  }
}

/** Ganti daftar siswa dalam satu kelas. */
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
        await tx.insert(classStudents).values(
          added.map((studentId) => ({ classId: input.classId, studentId })),
        );
      }
    });

    revalidatePath(`/dashboard/kelas/${input.classId}`);
    revalidatePath(`/dashboard/kelas/${input.classId}/qr`);
    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Anggota kelas tersimpan." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Anggota kelas gagal disimpan.",
    );
  }
}