import { cache } from "react";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireAuthContext } from "@/lib/auth";
import { tandatamani } from "@/lib/storage-signed";
import { redirect } from "next/navigation";
import { withRlsDb, type RlsTx } from "../rls";
import {
  classStudents,
  classes,
  learningSessions,
  materialAdaptations,
  materials,
  notifications,
  ppiDocuments,
  profiles,
  progressRecords,
  studentAccessTokens,
  studentProfiles,
  students,
  visualAssets,
} from "../schema";
import type {
  AdaptedContent,
  AppNotification,
  ClassRoom,
  LearningSession,
  Material,
  MaterialAdaptation,
  NotificationType,
  PpiContent,
  PpiDocument,
  ProgressRecord,
  SkillLevel,
  Student,
  StudentProfile,
  TeacherProfile,
  VisualAsset,
} from "../types";

/**
 * Query layer Guru. Semua fungsi berjalan di bawah RLS: transaksi-nya
 * menurunkan privilege ke role `authenticated` dengan JWT guru yang sedang
 * login, jadi baris milik guru lain mustahil terbaca.
 *
 * Nama fungsi sengaja sama dengan accessor Tahap 1 agar halaman tidak perlu
 * berubah selain import.
 */

type StudentRow = typeof students.$inferSelect;
type ProfileRow = typeof studentProfiles.$inferSelect;
type ClassRow = typeof classes.$inferSelect;
type MaterialRow = typeof materials.$inferSelect;
type AdaptationRow = typeof materialAdaptations.$inferSelect;
type AssetRow = typeof visualAssets.$inferSelect;
type TokenRow = typeof studentAccessTokens.$inferSelect;
type SessionRow = typeof learningSessions.$inferSelect;
type RecordRow = typeof progressRecords.$inferSelect;
type PpiRow = typeof ppiDocuments.$inferSelect;
type NotificationRow = typeof notifications.$inferSelect;

export type TokenRowView = {
  id: string;
  studentId: string;
  classId: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export const EMPTY_ADAPTED: AdaptedContent = {
  sections: [],
  readingLevel: "",
  generatedFor: "",
};

export const EMPTY_PPI: PpiContent = {
  strengths: "",
  needs: [],
  objectives: [],
  services: [],
  schedule: [],
  materials: [],
  evaluation: "",
  familyNotes: "",
  teacherSignature: "",
  headmasterSignature: "",
};

export function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    teacherId: row.teacherId,
    fullName: row.fullName,
    nickname: row.nickname ?? row.fullName.split(" ")[0],
    age: row.age ?? 0,
    gender: row.gender === "P" ? "P" : "L",
    photoUrl: row.photoUrl ?? "",
    disabilityType: row.disabilityType,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
  };
}

export function toStudentProfile(row: ProfileRow): StudentProfile {
  const level = (row.academicLevel ?? "medium") as SkillLevel;
  return {
    studentId: row.studentId,
    academicLevel: level,
    academicDetails: row.academicDetails ?? {
      membaca: level,
      menulis: level,
      berhitung: level,
    },
    socialEmotional: row.socialEmotional ?? {
      mengenaliOrang: level,
      bekerjaSama: level,
      mengaturEmosi: level,
      catatan: "",
    },
    motorSkills: row.motorSkills ?? {
      motorHalus: level,
      motorKasar: level,
      catatan: "",
    },
    independence: row.independence ?? {
      dressed: level,
      makan: level,
      menggunakanAlat: level,
      catatan: "",
    },
    learningPreferences: row.learningPreferences ?? {
      visual: true,
      audio: false,
      kinestetik: false,
    },
    interactionModes: row.interactionModes ?? {
      touch: true,
      speech: false,
      keyboard: false,
      switch: false,
      drag: false,
    },
    uiTokens: row.uiTokens ?? {
      fontSize: level,
      contrastMode: "normal",
      audioEnabled: true,
      audioSpeed: "normal",
      navStyle: "step",
    },
    updatedAt: row.updatedAt,
  };
}

export function toClass(row: ClassRow): ClassRoom {
  return {
    id: row.id,
    teacherId: row.teacherId,
    name: row.name,
    subject: row.subject ?? "",
    grade: row.grade ?? "",
    description: row.description ?? "",
    room: row.room ?? "",
    createdAt: row.createdAt,
  };
}

export function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    teacherId: row.teacherId,
    classId: row.classId,
    title: row.title,
    subject: row.subject ?? "",
    sourceType: row.sourceType,
    sourceFileName: row.sourceFileName ?? "",
    sourceText: row.sourceText ?? "",
    status: row.status,
    aiAnalysis: row.aiAnalysis ?? null,
    createdAt: row.createdAt,
  };
}

export function toAdaptation(row: AdaptationRow): MaterialAdaptation {
  return {
    id: row.id,
    materialId: row.materialId,
    studentId: row.studentId,
    version: row.version,
    status: row.status,
    adaptedContent: row.adaptedContent ?? EMPTY_ADAPTED,
    aiModel: row.aiModel ?? "",
    aiPromptSnapshot: row.aiPromptSnapshot ?? "",
    teacherEdits: row.teacherEdits ?? [],
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
  };
}

export function toAsset(row: AssetRow): VisualAsset {
  return {
    id: row.id,
    materialAdaptationId: row.materialAdaptationId,
    sectionIndex: row.sectionIndex,
    prompt: row.prompt,
    model: row.model,
    altText: row.altText,
    status: row.status as VisualAsset["status"],
    // Fallback untuk data lama yang imageUrl-nya masih URL publik. Aset baru
    // memakai storagePath lalu ditandatangani saat dibaca.
    imageUrl: row.imageUrl ?? null,
    createdAt: row.createdAt,
  };
}

export function toToken(row: TokenRow): TokenRowView {
  return {
    id: row.id,
    studentId: row.studentId,
    classId: row.classId,
    isActive: row.isActive,
    expiresAt: row.expiresAt ?? "",
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  };
}

export function toSession(row: SessionRow): LearningSession {
  return {
    id: row.id,
    studentId: row.studentId,
    classId: row.classId ?? "",
    materialAdaptationId: row.materialAdaptationId,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    durationSeconds: row.durationSeconds ?? 0,
  };
}

export function toRecord(row: RecordRow): ProgressRecord {
  const response = row.response;
  return {
    id: row.id,
    sessionId: row.sessionId,
    studentId: row.studentId,
    sectionIndex: row.sectionIndex,
    interactionType: (row.interactionType ?? "touch") as ProgressRecord["interactionType"],
    response:
      typeof response === "string"
        ? response
        : response === null || response === undefined
          ? ""
          : JSON.stringify(response),
    isCorrect: row.isCorrect,
    timeSpentSeconds: row.timeSpentSeconds ?? 0,
    createdAt: row.createdAt,
  };
}

export function toPpi(row: PpiRow): PpiDocument {
  return {
    id: row.id,
    teacherId: row.teacherId,
    studentId: row.studentId,
    academicYear: row.academicYear ?? "",
    status: row.status === "final" ? "final" : "draft",
    pdfUrl: row.pdfUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    content: row.content ?? EMPTY_PPI,
  };
}

export function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    body: row.body ?? "",
    type: row.type as NotificationType,
    link: row.link ?? "",
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

async function rls<T>(fn: (tx: RlsTx) => Promise<T>): Promise<T> {
  const context = await requireAuthContext();
  return withRlsDb(context.claims, fn);
}

/** =========================================================
 *  Guru
 *  ========================================================= */
export const getTeacher = cache(async (): Promise<TeacherProfile> => {
  const context = await requireAuthContext();
  const row = await withRlsDb(context.claims, async (tx) => {
    const [found] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, context.userId))
      .limit(1);
    return found ?? null;
  });

  if (!row) redirect("/masuk");

  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    nickname: row.nickname ?? row.fullName.split(",")[0],
    role: row.role,
    schoolName: row.schoolName ?? "",
    city: row.city ?? "",
    subjects: row.subjects ?? [],
    photoUrl: row.avatarUrl ?? "",
    onboardingCompleted: row.onboardingCompleted,
    preferences: row.preferences ?? { notificationsEnabled: true },
  };
});

/** =========================================================
 *  Siswa & profil belajar
 *  ========================================================= */
export const getStudents = cache(async (): Promise<Student[]> => {
  const rows = await rls((tx) =>
    tx
      .select()
      .from(students)
      .orderBy(sql`lower(${students.fullName})`),
  );
  return rows.map(toStudent);
});

export const getStudent = cache(async (id: string): Promise<Student | null> => {
  const rows = await rls((tx) =>
    tx.select().from(students).where(eq(students.id, id)).limit(1),
  );
  return rows[0] ? toStudent(rows[0]) : null;
});

export const getStudentProfile = cache(
  async (studentId: string): Promise<StudentProfile | null> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.studentId, studentId))
        .limit(1),
    );
    return rows[0] ? toStudentProfile(rows[0]) : null;
  },
);

/** =========================================================
 *  Kelas
 *  ========================================================= */
export const getClasses = cache(async (): Promise<ClassRoom[]> => {
  const rows = await rls((tx) =>
    tx.select().from(classes).orderBy(sql`lower(${classes.name})`),
  );
  return rows.map(toClass);
});

export const getClass = cache(async (id: string): Promise<ClassRoom | null> => {
  const rows = await rls((tx) =>
    tx.select().from(classes).where(eq(classes.id, id)).limit(1),
  );
  return rows[0] ? toClass(rows[0]) : null;
});

export const getClassStudents = cache(
  async (classId: string): Promise<Student[]> => {
    const rows = await rls((tx) =>
      tx
        .select({ student: students })
        .from(classStudents)
        .innerJoin(students, eq(students.id, classStudents.studentId))
        .where(eq(classStudents.classId, classId))
        .orderBy(sql`lower(${students.fullName})`),
    );
    return rows.map((row) => toStudent(row.student));
  },
);

export const getStudentClasses = cache(
  async (studentId: string): Promise<ClassRoom[]> => {
    const rows = await rls((tx) =>
      tx
        .select({ room: classes })
        .from(classStudents)
        .innerJoin(classes, eq(classes.id, classStudents.classId))
        .where(eq(classStudents.studentId, studentId))
        .orderBy(sql`lower(${classes.name})`),
    );
    return rows.map((row) => toClass(row.room));
  },
);

export type ClassWithMeta = ClassRoom & {
  studentCount: number;
  materialCount: number;
  activeTokens: number;
};

export const getClassesWithMeta = cache(async (): Promise<ClassWithMeta[]> => {
  return rls(async (tx) => {
    const roomRows = await tx
      .select()
      .from(classes)
      .orderBy(sql`lower(${classes.name})`);

    const memberCounts = await tx
      .select({
        classId: classStudents.classId,
        total: sql<number>`count(*)::int`,
      })
      .from(classStudents)
      .groupBy(classStudents.classId);

    const materialCounts = await tx
      .select({
        classId: materials.classId,
        total: sql<number>`count(*)::int`,
      })
      .from(materials)
      .groupBy(materials.classId);

    const tokenCounts = await tx
      .select({
        classId: studentAccessTokens.classId,
        total: sql<number>`count(*)::int`,
      })
      .from(studentAccessTokens)
      .where(eq(studentAccessTokens.isActive, true))
      .groupBy(studentAccessTokens.classId);

    const memberById = new Map(memberCounts.map((r) => [r.classId, r.total]));
    const materialById = new Map(
      materialCounts.filter((r) => r.classId).map((r) => [r.classId as string, r.total]),
    );
    const tokenById = new Map(tokenCounts.map((r) => [r.classId, r.total]));

    return roomRows.map((row) => ({
      ...toClass(row),
      studentCount: memberById.get(row.id) ?? 0,
      materialCount: materialById.get(row.id) ?? 0,
      activeTokens: tokenById.get(row.id) ?? 0,
    }));
  });
});

/** =========================================================
 *  Materi & adaptasi
 *  ========================================================= */
export const getMaterials = cache(async (): Promise<Material[]> => {
  const rows = await rls((tx) =>
    tx.select().from(materials).orderBy(desc(materials.createdAt)),
  );
  return rows.map(toMaterial);
});

export const getMaterial = cache(async (id: string): Promise<Material | null> => {
  const rows = await rls((tx) =>
    tx.select().from(materials).where(eq(materials.id, id)).limit(1),
  );
  return rows[0] ? toMaterial(rows[0]) : null;
});

export const getClassMaterials = cache(
  async (classId: string): Promise<Material[]> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(materials)
        .where(eq(materials.classId, classId))
        .orderBy(desc(materials.createdAt)),
    );
    return rows.map(toMaterial);
  },
);

export const getMaterialAdaptations = cache(
  async (materialId: string): Promise<MaterialAdaptation[]> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(materialAdaptations)
        .where(eq(materialAdaptations.materialId, materialId))
        .orderBy(desc(materialAdaptations.version), desc(materialAdaptations.createdAt)),
    );
    return rows.map(toAdaptation);
  },
);

export const getAdaptation = cache(
  async (materialId: string, studentId: string): Promise<MaterialAdaptation | null> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(materialAdaptations)
        .where(
          and(
            eq(materialAdaptations.materialId, materialId),
            eq(materialAdaptations.studentId, studentId),
          ),
        )
        // Satu siswa bisa punya banyak versi. Tanpa pengurutan ini, limit 1
        // bisa mengembalikan versi lama dan bukan versi terbaru.
        .orderBy(desc(materialAdaptations.version))
        .limit(1),
    );
    return rows[0] ? toAdaptation(rows[0]) : null;
  },
);

export const getStudentAdaptations = cache(
  async (studentId: string): Promise<MaterialAdaptation[]> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(materialAdaptations)
        .where(eq(materialAdaptations.studentId, studentId))
        .orderBy(desc(materialAdaptations.createdAt)),
    );
    return rows.map(toAdaptation);
  },
);

export const getAllAdaptations = cache(async (): Promise<MaterialAdaptation[]> => {
  const rows = await rls((tx) =>
    tx.select().from(materialAdaptations).orderBy(desc(materialAdaptations.createdAt)),
  );
  return rows.map(toAdaptation);
});

export const getAdaptationById = cache(
  async (id: string): Promise<MaterialAdaptation | null> => {
    const rows = await rls((tx) =>
      tx.select().from(materialAdaptations).where(eq(materialAdaptations.id, id)).limit(1),
    );
    return rows[0] ? toAdaptation(rows[0]) : null;
  },
);

export const getVisualAssets = cache(
  async (adaptationId: string): Promise<VisualAsset[]> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(visualAssets)
        .where(eq(visualAssets.materialAdaptationId, adaptationId))
        .orderBy(visualAssets.sectionIndex),
    );

    // Bucket privat: jalur di database diganti signed URL agar bisa dirender.
    const bertanda = await tandatamani(rows.map((row) => row.storagePath));
    return rows.map((row) => ({
      ...toAsset(row),
      imageUrl: bertanda.get(row.storagePath) ?? row.imageUrl ?? null,
    }));
  },
);

/** =========================================================
 *  Token QR
 *  ========================================================= */
export const getTokens = cache(async (classId: string): Promise<TokenRowView[]> => {
  const rows = await rls((tx) =>
    tx
      .select()
      .from(studentAccessTokens)
      .where(eq(studentAccessTokens.classId, classId))
      .orderBy(desc(studentAccessTokens.createdAt)),
  );
  return rows.map(toToken);
});

export const getTokensByStudent = cache(
  async (studentId: string): Promise<TokenRowView[]> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(studentAccessTokens)
        .where(eq(studentAccessTokens.studentId, studentId))
        .orderBy(desc(studentAccessTokens.createdAt)),
    );
    return rows.map(toToken);
  },
);

export const isTokenExpired = async (expiresAt: string): Promise<boolean> => {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
};

/** =========================================================
 *  Sesi belajar & progres
 *  ========================================================= */
export const getSessions = cache(
  async (studentId?: string): Promise<LearningSession[]> => {
    const rows = await rls((tx) => {
      const base = tx.select().from(learningSessions);
      return (studentId
        ? base.where(eq(learningSessions.studentId, studentId))
        : base
      ).orderBy(desc(learningSessions.startedAt));
    });
    return rows.map(toSession);
  },
);

export const getRecords = cache(
  async (studentId?: string): Promise<ProgressRecord[]> => {
    const rows = await rls((tx) => {
      const base = tx.select().from(progressRecords);
      return (studentId
        ? base.where(eq(progressRecords.studentId, studentId))
        : base
      ).orderBy(desc(progressRecords.createdAt));
    });
    return rows.map(toRecord);
  },
);

export type StudentProgressSummary = {
  student: Student;
  sessions: number;
  completed: number;
  totalSeconds: number;
  minutes: number;
  interactions: number;
  accuracy: number;
  published: number;
};

export const getProgressSummary = cache(
  async (): Promise<StudentProgressSummary[]> => {
    return rls(async (tx) => {
      const studentRows = await tx
        .select()
        .from(students)
        .orderBy(sql`lower(${students.fullName})`);

      const sessionRows = await tx
        .select({
          studentId: learningSessions.studentId,
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(${learningSessions.completedAt})::int`,
          seconds: sql<number>`coalesce(sum(${learningSessions.durationSeconds}), 0)::int`,
        })
        .from(learningSessions)
        .groupBy(learningSessions.studentId);

      const recordRows = await tx
        .select({
          studentId: progressRecords.studentId,
          total: sql<number>`count(*)::int`,
          correct: sql<number>`count(${progressRecords.isCorrect})::int`,
        })
        .from(progressRecords)
        .groupBy(progressRecords.studentId);

      const publishedRows = await tx
        .select({
          studentId: materialAdaptations.studentId,
          total: sql<number>`count(${materialAdaptations.id})::int`,
        })
        .from(materialAdaptations)
        .innerJoin(materials, eq(materials.id, materialAdaptations.materialId))
        .where(eq(materials.status, "published"))
        .groupBy(materialAdaptations.studentId);

      const sessionsByStudent = new Map(sessionRows.map((r) => [r.studentId, r]));
      const recordsByStudent = new Map(recordRows.map((r) => [r.studentId, r]));
      const publishedByStudent = new Map(publishedRows.map((r) => [r.studentId, r]));

      return studentRows.map((row) => {
        const student = toStudent(row);
        const session = sessionsByStudent.get(row.id);
        const record = recordsByStudent.get(row.id);
        const interactions = record?.total ?? 0;
        const correct = record?.correct ?? 0;
        const totalSeconds = session?.seconds ?? 0;
        return {
          student,
          sessions: session?.total ?? 0,
          completed: session?.completed ?? 0,
          totalSeconds,
          minutes: Math.round(totalSeconds / 60),
          interactions,
          accuracy: interactions ? Math.round((correct / interactions) * 100) : 0,
          published: publishedByStudent.get(row.id)?.total ?? 0,
        };
      });
    });
  },
);

export const getDailyActivity = cache(
  async (): Promise<{ date: string; minutes: number }[]> => {
    return rls((tx) =>
      tx
        .select({
          date: sql<string>`to_char(${learningSessions.startedAt}, 'YYYY-MM-DD')`,
          minutes: sql<number>`coalesce(round(sum(${learningSessions.durationSeconds}) / 60.0), 0)::int`,
        })
        .from(learningSessions)
        .groupBy(sql`to_char(${learningSessions.startedAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${learningSessions.startedAt}, 'YYYY-MM-DD')`),
    );
  },
);

export type RecentSessionRow = {
  session: LearningSession;
  student: Student;
  material: Material | null;
};

export const getRecentSessions = cache(
  async (limit = 5): Promise<RecentSessionRow[]> => {
    return rls(async (tx) => {
      const rows = await tx
        .select({ session: learningSessions, student: students })
        .from(learningSessions)
        .innerJoin(students, eq(students.id, learningSessions.studentId))
        .orderBy(desc(learningSessions.startedAt))
        .limit(limit);

      const adaptations = rows
        .map((row) => row.session.materialAdaptationId)
        .filter((value): value is string => Boolean(value));
      if (adaptations.length === 0) {
        return rows.map((row) => ({
          session: toSession(row.session),
          student: toStudent(row.student),
          material: null,
        }));
      }

      const materialRows = await tx
        .select({
          adaptationId: materialAdaptations.id,
          material: materials,
        })
        .from(materialAdaptations)
        .innerJoin(materials, eq(materials.id, materialAdaptations.materialId))
        .where(inArray(materialAdaptations.id, adaptations));
      const materialByAdaptation = new Map(
        materialRows.map((row) => [row.adaptationId, toMaterial(row.material)]),
      );

      return rows.map((row) => ({
        session: toSession(row.session),
        student: toStudent(row.student),
        material: row.session.materialAdaptationId
          ? (materialByAdaptation.get(row.session.materialAdaptationId) ?? null)
          : null,
      }));
    });
  },
);

/** =========================================================
 *  PPI
 *  ========================================================= */
export const getPpiDocuments = cache(async (): Promise<PpiDocument[]> => {
  const rows = await rls((tx) =>
    tx.select().from(ppiDocuments).orderBy(desc(ppiDocuments.updatedAt)),
  );
  return rows.map(toPpi);
});

export const getPpiDocument = cache(
  async (id: string): Promise<PpiDocument | null> => {
    const rows = await rls((tx) =>
      tx.select().from(ppiDocuments).where(eq(ppiDocuments.id, id)).limit(1),
    );
    return rows[0] ? toPpi(rows[0]) : null;
  },
);

export const getStudentPpi = cache(
  async (studentId: string): Promise<PpiDocument[]> => {
    const rows = await rls((tx) =>
      tx
        .select()
        .from(ppiDocuments)
        .where(eq(ppiDocuments.studentId, studentId))
        .orderBy(desc(ppiDocuments.updatedAt)),
    );
    return rows.map(toPpi);
  },
);

/** =========================================================
 *  Notifikasi
 *  ========================================================= */
export const getNotifications = cache(async (): Promise<AppNotification[]> => {
  return rls(async (tx) => {
    const rows = await tx
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    return rows.map(toNotification);
  });
});

export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  return rls(async (tx) => {
    const rows = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.isRead, false));
    return rows[0]?.total ?? 0;
  });
});

/** =========================================================
 *  Checklist dasbor
 *  ========================================================= */
export type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  count: number;
  tone: "info" | "warning" | "success" | "destructive";
};

export const getTeacherChecklist = cache(async (): Promise<ChecklistItem[]> => {
  return rls(async (tx) => {
    const [draftCount] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(materialAdaptations)
      .where(sql`${materialAdaptations.status} in ('draft','edited')`);

    const [incomplete] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(students)
      .leftJoin(studentProfiles, eq(studentProfiles.studentId, students.id))
      .where(
        sql`${studentProfiles.id} is null or ${studentProfiles.interactionModes} is null`,
      );

    const [failedAssets] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(visualAssets)
      .where(eq(visualAssets.status, "failed"));

    const [ppiDrafts] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(ppiDocuments)
      .where(eq(ppiDocuments.status, "draft"));

    const [inactiveTokens] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(studentAccessTokens)
      .where(eq(studentAccessTokens.isActive, false));

    const firstDraft = await tx
      .select({
        id: materialAdaptations.id,
        materialId: materialAdaptations.materialId,
        studentId: materialAdaptations.studentId,
      })
      .from(materialAdaptations)
      .where(sql`${materialAdaptations.status} in ('draft','edited')`)
      .orderBy(materialAdaptations.createdAt)
      .limit(1);
    const items: ChecklistItem[] = [];

    if (draftCount?.total) {
      const row = firstDraft[0];
      items.push({
        id: "review",
        label: "Adaptasi menunggu review",
        detail: `${draftCount.total} versi adaptasi perlu Anda periksa sebelum diterbitkan ke siswa.`,
        href: row
          ? `/dashboard/materi/${row.materialId}/adaptasi/${row.studentId}`
          : "/dashboard/materi",
        count: draftCount.total,
        tone: "warning",
      });
    }

    if (incomplete?.total) {
      items.push({
        id: "profile",
        label: "Profil belajar belum lengkap",
        detail: `${incomplete.total} siswa belum punya bentuk interaksi yang tercatat, sehingga adaptasi bisa kurang tepat.`,
        href: "/dashboard/siswa",
        count: incomplete.total,
        tone: "warning",
      });
    }

    if (failedAssets?.total) {
      items.push({
        id: "visual",
        label: "Ilustrasi gagal dibuat",
        detail: `${failedAssets.total} ilustrasi perlu dibuat ulang atau diunggah manual.`,
        href: "/dashboard/materi",
        count: failedAssets.total,
        tone: "destructive",
      });
    }

    if (ppiDrafts?.total) {
      items.push({
        id: "ppi",
        label: "Dokumen PPI masih draft",
        detail: `${ppiDrafts.total} dokumen PPI belum difinalkan dan diekspor ke PDF.`,
        href: "/dashboard/ppi",
        count: ppiDrafts.total,
        tone: "info",
      });
    }

    if (inactiveTokens?.total) {
      items.push({
        id: "token",
        label: "Token akses nonaktif",
        detail: `${inactiveTokens.total} siswa tidak bisa membuka materi lewat QR. Aktifkan kembali dari halaman kelas bila sudah dipakai lagi.`,
        href: "/dashboard/kelas",
        count: inactiveTokens.total,
        tone: "destructive",
      });
    }

    return items;
  });
});