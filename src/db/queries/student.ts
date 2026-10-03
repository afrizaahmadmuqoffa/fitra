import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { withServiceDb } from "../rls";
import { hashToken } from "@/lib/tokens";
import { DISABILITY_LABELS } from "@/lib/constants";
import {
  classStudents,
  classes,
  learningSessions,
  materialAdaptations,
  materials,
  progressRecords,
  studentAccessTokens,
  studentProfiles,
  students,
  visualAssets,
} from "../schema";
import type {
  LearningSession,
  Material,
  ProgressRecord,
  Student,
  SkillLevel,
  StudentProfile,
} from "../types";
import {
  toAdaptation,
  toAsset,
  toClass,
  toRecord,
  toSession,
  toStudent,
  toStudentProfile,
} from "./teacher";

/**
 * Query layer Siswa (`/belajar/*`).
 *
 * Siswa tidak punya akun, jadi tidak ada JWT guru yang bisa dipakai. Jalur ini
 * berjalan sebagai `service_role` dan ALWAYS digerbang lebih dulu oleh hash
 * token QR: baris yang bisa dibaca hanya milik siswa pemilik token tersebut.
 */

export type StudentAccess = {
  id: string;
  studentId: string;
  classId: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string | null;
};

/** Validasi token QR: hash -> baris token. */
export async function resolveStudentAccess(token: string): Promise<StudentAccess | null> {
  const tokenHash = hashToken(token);
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select()
      .from(studentAccessTokens)
      .where(eq(studentAccessTokens.tokenHash, tokenHash))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    await tx
      .update(studentAccessTokens)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(studentAccessTokens.id, row.id));
    return {
      id: row.id,
      studentId: row.studentId,
      classId: row.classId,
      isActive: row.isActive,
      expiresAt: row.expiresAt ?? "",
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt,
    };
  });
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    return rows[0] ? toStudent(rows[0]) : null;
  });
}

export async function getStudentClasses(studentId: string) {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select({ room: classes })
      .from(classStudents)
      .innerJoin(classes, eq(classes.id, classStudents.classId))
      .where(eq(classStudents.studentId, studentId))
      .orderBy(sql`lower(${classes.name})`);
    return rows.map((row) => toClass(row.room));
  });
}

export type ActiveMaterialRow = {
  adaptationId: string;
  materialId: string;
  title: string;
  subject: string;
  sections: number;
  status: string;
  approvedAt: string | null;
};

/** Materi yang tampil di layar siswa: adaptasi disetujui dan materi terbit. */
export async function getActiveMaterialsForStudent(
  studentId: string,
): Promise<ActiveMaterialRow[]> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select({
        adaptationId: materialAdaptations.id,
        materialId: materials.id,
        title: materials.title,
        subject: materials.subject,
        status: materialAdaptations.status,
        approvedAt: materialAdaptations.approvedAt,
        sections: materialAdaptations.adaptedContent,
      })
      .from(materialAdaptations)
      .innerJoin(materials, eq(materials.id, materialAdaptations.materialId))
      .where(
        and(
          eq(materialAdaptations.studentId, studentId),
          eq(materialAdaptations.status, "approved"),
          eq(materials.status, "published"),
        ),
      )
      .orderBy(desc(materialAdaptations.approvedAt));

    return rows.map((row) => {
      const content = row.sections as { sections?: unknown[] } | null;
      return {
        adaptationId: row.adaptationId,
        materialId: row.materialId,
        title: row.title,
        subject: row.subject ?? "",
        sections: Array.isArray(content?.sections) ? content.sections.length : 0,
        status: row.status,
        approvedAt: row.approvedAt,
      };
    });
  });
}

export async function getSessionsForStudent(
  studentId: string,
): Promise<LearningSession[]> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.studentId, studentId))
      .orderBy(desc(learningSessions.startedAt));
    return rows.map(toSession);
  });
}

export async function getRecordsForStudent(
  studentId: string,
): Promise<ProgressRecord[]> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select()
      .from(progressRecords)
      .where(eq(progressRecords.studentId, studentId))
      .orderBy(desc(progressRecords.createdAt));
    return rows.map(toRecord);
  });
}

export type StudentContext = {
  student: Student | null;
  profile: StudentProfile | null;
};

/** Data siswa untuk layar siswa: identitas dan profil belajar. */
export async function getStudentContextForStudent(
  studentId: string,
): Promise<StudentContext> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select({ student: students, profile: studentProfiles })
      .from(students)
      .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
      .where(eq(students.id, studentId))
      .limit(1);
    const row = rows[0];
    if (!row) return { student: null, profile: null };
    return {
      student: toStudent(row.student),
      profile: row.profile ? toStudentProfile(row.profile) : null,
    };
  });
}

export type ApprovedAdaptation = {
  state: "ready" | "locked" | "not-found";
  adaptation: ReturnType<typeof toAdaptation>;
  material: Material;
  assets: ReturnType<typeof toAsset>[];
  studentId: string;
};

/**
 * Materi untuk pemutar adaptif.
 * `ready` hanya untuk adaptasi yang disetujui dari materi yang sudah terbit;
 * `locked` berarti adaptasi ada tapi guru belum menyetujui atau menerbitkannya.
 */
export async function getApprovedAdaptation(
  adaptationId: string,
): Promise<ApprovedAdaptation | null> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .select({ adaptation: materialAdaptations, material: materials })
      .from(materialAdaptations)
      .innerJoin(materials, eq(materials.id, materialAdaptations.materialId))
      .where(eq(materialAdaptations.id, adaptationId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const state =
      row.adaptation.status === "approved" && row.material.status === "published"
        ? "ready"
        : "locked";

    const assetRows = await tx
      .select()
      .from(visualAssets)
      .where(eq(visualAssets.materialAdaptationId, adaptationId))
      .orderBy(visualAssets.sectionIndex);

    return {
      state,
      adaptation: toAdaptation(row.adaptation),
      material: {
        id: row.material.id,
        teacherId: row.material.teacherId,
        classId: row.material.classId,
        title: row.material.title,
        subject: row.material.subject ?? "",
        sourceType: row.material.sourceType,
        sourceFileName: row.material.sourceFileName ?? "",
        sourceText: row.material.sourceText ?? "",
        status: row.material.status,
        aiAnalysis: row.material.aiAnalysis ?? null,
        createdAt: row.material.createdAt,
      },
      assets: assetRows.map(toAsset),
      studentId: row.adaptation.studentId,
    };
  });
}

export async function startLearningSession(input: {
  studentId: string;
  classId: string;
  adaptationId: string;
}): Promise<string> {
  return withServiceDb(async (tx) => {
    const rows = await tx
      .insert(learningSessions)
      .values({
        studentId: input.studentId,
        classId: input.classId || null,
        materialAdaptationId: input.adaptationId,
      })
      .returning({ id: learningSessions.id });
    return rows[0].id;
  });
}

export async function completeLearningSession(
  sessionId: string,
  durationSeconds: number,
): Promise<void> {
  await withServiceDb(async (tx) => {
    await tx
      .update(learningSessions)
      .set({
        completedAt: new Date().toISOString(),
        durationSeconds: Math.max(0, Math.round(durationSeconds)),
      })
      .where(eq(learningSessions.id, sessionId));
  });
}

export async function insertProgressRecord(input: {
  sessionId: string;
  studentId: string;
  sectionIndex: number;
  interactionType: string;
  response: string;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
}): Promise<void> {
  await withServiceDb(async (tx) => {
    await tx.insert(progressRecords).values({
      sessionId: input.sessionId,
      studentId: input.studentId,
      sectionIndex: input.sectionIndex,
      interactionType: input.interactionType,
      response: input.response,
      isCorrect: input.isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
    });
  });
}

export type SimulatedProfile = {
  id: string;
  token: string;
  name: string;
  nickname: string;
  photoUrl: string;
  disabilityLabel: string;
  academicLevel: SkillLevel;
  interactionModes: StudentProfile["interactionModes"];
  uiTokens: StudentProfile["uiTokens"];
};

/**
 * Profil untuk Mode Simulasi di halaman siswa. Hanya siswa yang token-nya
 * baru dibuat/rotasi (ada di cookie reveal guru) yang bisa dipilih, karena
 * database tidak menyimpan teks token.
 */
export async function getSimulatedProfiles(
  revealed: Record<string, string>,
): Promise<SimulatedProfile[]> {
  const studentIds = Object.keys(revealed);
  if (studentIds.length === 0) return [];

  return withServiceDb(async (tx) => {
    const rows = await tx
      .select({ student: students, profile: studentProfiles })
      .from(students)
      .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
      .where(inArray(students.id, studentIds));

return rows.flatMap((row) => {
      const token = revealed[row.student.id];
      if (!token) return [];
const level = (row.profile?.academicLevel ?? "medium") as SkillLevel;
      return [
        {
          id: row.student.id,
          token,
          name: row.student.fullName,
          nickname: row.student.nickname ?? row.student.fullName.split(" ")[0],
          photoUrl: row.student.photoUrl ?? "",
          disabilityLabel:
            DISABILITY_LABELS[row.student.disabilityType] ?? row.student.disabilityType,
          academicLevel: level,
          interactionModes:
            (row.profile?.interactionModes as StudentProfile["interactionModes"] | null) ?? {
              touch: true,
              speech: false,
              keyboard: false,
              switch: false,
              drag: false,
            },
          uiTokens:
            (row.profile?.uiTokens as StudentProfile["uiTokens"] | null) ?? {
              fontSize: level,
              contrastMode: "normal",
              audioEnabled: true,
              audioSpeed: "normal",
              navStyle: "step",
            },
        },
      ];
    });
  });
}