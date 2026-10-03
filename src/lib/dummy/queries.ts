import { classStudents, classes } from "./classes";
import {
  learningSessions,
  notifications,
  ppiDocuments,
  progressRecords,
  studentTokens,
} from "./learning";
import { adaptations, materials, visualAssets } from "./materials";
import { DISABILITY_LABELS } from "../constants";
import { studentProfiles, students, teacher } from "./people";
import type {
  ClassRoom,
  LearningSession,
  Material,
  MaterialAdaptation,
  ProgressRecord,
  Student,
  StudentProfile,
} from "./types";

/**
 * Tahap 1 accessor layer. Every function is async so the call sites stay
 * identical when these are replaced by Drizzle queries in Tahap 2.
 */
export async function getTeacher() {
  return teacher;
}

export async function getStudents(): Promise<Student[]> {
  return students;
}

export async function getStudent(id: string): Promise<Student | null> {
  return students.find((s) => s.id === id) ?? null;
}

export async function getStudentProfile(
  id: string,
): Promise<StudentProfile | null> {
  return studentProfiles.find((p) => p.studentId === id) ?? null;
}

export async function getClasses(): Promise<ClassRoom[]> {
  return classes;
}

export async function getClass(id: string): Promise<ClassRoom | null> {
  return classes.find((c) => c.id === id) ?? null;
}

export async function getClassStudents(classId: string): Promise<Student[]> {
  const ids = classStudents
    .filter((cs) => cs.classId === classId)
    .map((cs) => cs.studentId);
  return students.filter((s) => ids.includes(s.id));
}

export async function getStudentClasses(studentId: string): Promise<ClassRoom[]> {
  const ids = classStudents
    .filter((cs) => cs.studentId === studentId)
    .map((cs) => cs.classId);
  return classes.filter((c) => ids.includes(c.id));
}

export async function getMaterials(): Promise<Material[]> {
  return materials;
}

export async function getMaterial(id: string): Promise<Material | null> {
  return materials.find((m) => m.id === id) ?? null;
}

export async function getClassMaterials(classId: string): Promise<Material[]> {
  return materials.filter((m) => m.classId === classId);
}

export async function getMaterialAdaptations(
  materialId: string,
): Promise<MaterialAdaptation[]> {
  return adaptations.filter((a) => a.materialId === materialId);
}

export async function getAdaptation(
  materialId: string,
  studentId: string,
): Promise<MaterialAdaptation | null> {
  return (
    adaptations.find(
      (a) => a.materialId === materialId && a.studentId === studentId,
    ) ?? null
  );
}

export async function getStudentAdaptations(
  studentId: string,
): Promise<MaterialAdaptation[]> {
  return adaptations.filter((a) => a.studentId === studentId);
}

export async function getVisualAssets(adaptationId: string) {
  return visualAssets.filter((v) => v.materialAdaptationId === adaptationId);
}

export async function getTokens(classId: string) {
  return studentTokens.filter((t) => t.classId === classId);
}

export async function getTokenByValue(token: string) {
  return studentTokens.find((t) => t.token === token) ?? null;
}

export async function isTokenExpired(expiresAt: string): Promise<boolean> {
  return new Date(expiresAt).getTime() < Date.now();
}

export async function getTokensByStudent(studentId: string) {
  return studentTokens.filter((t) => t.studentId === studentId);
}

export async function getNotifications() {
  return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSessions(studentId?: string): Promise<LearningSession[]> {
  const list = studentId
    ? learningSessions.filter((s) => s.studentId === studentId)
    : learningSessions;
  return [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getRecords(
  studentId?: string,
): Promise<ProgressRecord[]> {
  const list = studentId
    ? progressRecords.filter((r) => r.studentId === studentId)
    : progressRecords;
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPpiDocuments() {
  return ppiDocuments;
}

export async function getPpiDocument(id: string) {
  return ppiDocuments.find((p) => p.id === id) ?? null;
}

export async function getStudentPpi(studentId: string) {
  return ppiDocuments.filter((p) => p.studentId === studentId);
}

/** Aggregates for /dashboard/progres. */
export async function getProgressSummary() {
  const sessions = await getSessions();
  const records = await getRecords();

  return students.map((student) => {
    const ownSessions = sessions.filter((s) => s.studentId === student.id);
    const ownRecords = records.filter((r) => r.studentId === student.id);
    const totalSeconds = ownSessions.reduce((a, s) => a + s.durationSeconds, 0);
    const correct = ownRecords.filter((r) => r.isCorrect).length;
    const published = adaptations.filter(
      (a) =>
        a.studentId === student.id &&
        materials.find((m) => m.id === a.materialId)?.status === "published",
    ).length;
    return {
      student,
      sessions: ownSessions.length,
      completed: ownSessions.filter((s) => s.completedAt).length,
      totalSeconds,
      minutes: Math.round(totalSeconds / 60),
      interactions: ownRecords.length,
      accuracy: ownRecords.length
        ? Math.round((correct / ownRecords.length) * 100)
        : 0,
      published,
    };
  });
}

/** Daily aggregate for the 30-day window on /dashboard/progres. */
export async function getDailyActivity() {
  const sessions = await getSessions();
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    const day = s.startedAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Math.round(s.durationSeconds / 60));
  }
  return [...byDay.entries()]
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
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

/** Materi yang benar-benar tampil di layar siswa: adaptasi disetujui dan materi terbit. */
export async function getActiveMaterialsForStudent(
  studentId: string,
): Promise<ActiveMaterialRow[]> {
  return adaptations.flatMap((adaptation) => {
    if (adaptation.studentId !== studentId) return [];
    if (adaptation.status !== "approved") return [];
    const material = materials.find((item) => item.id === adaptation.materialId);
    if (!material || material.status !== "published") return [];
    return [
      {
        adaptationId: adaptation.id,
        materialId: adaptation.materialId,
        title: material.title,
        subject: material.subject,
        sections: adaptation.adaptedContent.sections.length,
        status: adaptation.status,
        approvedAt: adaptation.approvedAt,
      },
    ];
  });
}

/** Profil siap pakai untuk mode simulasi pada halaman siswa. */
export async function getSimulatedProfiles() {
  return students.flatMap((student) => {
    const profile = studentProfiles.find((item) => item.studentId === student.id);
    const token = studentTokens.find(
      (item) => item.studentId === student.id && item.isActive,
    );
    if (!profile || !token) return [];
    return [
      {
        id: student.id,
        token: token.token,
        name: student.fullName,
        nickname: student.nickname,
        photoUrl: student.photoUrl,
        disabilityLabel: DISABILITY_LABELS[student.disabilityType] ?? student.disabilityType,
        academicLevel: profile.academicLevel,
        interactionModes: profile.interactionModes,
        uiTokens: profile.uiTokens,
      },
    ];
  });
}

export type StudentProgressSummary = Awaited<
  ReturnType<typeof getProgressSummary>
>[number];

export async function getAllAdaptations(): Promise<MaterialAdaptation[]> {
  return adaptations;
}

export async function getAdaptationById(
  id: string,
): Promise<MaterialAdaptation | null> {
  return adaptations.find((a) => a.id === id) ?? null;
}

export type RecentSessionRow = {
  session: LearningSession;
  student: Student;
  material: Material | null;
};

/** Sesi terakhir yang dicampur dengan nama siswa dan judul materi untuk dasbor. */
export async function getRecentSessions(limit = 5): Promise<RecentSessionRow[]> {
  const sessions = await getSessions();
  return sessions.slice(0, limit).map((session) => {
    const adaptation = session.materialAdaptationId
      ? adaptations.find((a) => a.id === session.materialAdaptationId)
      : null;
    return {
      session,
      student: students.find((s) => s.id === session.studentId)!,
      material: adaptation
        ? materials.find((m) => m.id === adaptation.materialId) ?? null
        : null,
    };
  });
}

export type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  count: number;
  tone: "info" | "warning" | "success" | "destructive";
};

/** Checklist aktivitas guru untuk kartu "Perlu perhatian Anda" di dasbor. */
export async function getTeacherChecklist(): Promise<ChecklistItem[]> {
  const drafts = adaptations.filter(
    (a) => a.status === "draft" || a.status === "edited",
  );
  const incompleteProfiles = students.filter((student) => {
    const profile = studentProfiles.find((p) => p.studentId === student.id);
    return !profile || Object.values(profile.interactionModes).every((v) => !v);
  });
  const failedAssets = visualAssets.filter((v) => v.status === "failed");
  const inactiveTokens = studentTokens.filter((t) => !t.isActive);
  const ppiDrafts = ppiDocuments.filter((p) => p.status === "draft");

  const items: ChecklistItem[] = [];

  if (drafts.length) {
    const first = drafts[0];
    items.push({
      id: "review",
      label: "Adaptasi menunggu review",
      detail: `${drafts.length} versi adaptasi perlu Anda periksa sebelum diterbitkan ke siswa.`,
      href: `/dashboard/materi/${first.materialId}/adaptasi/${first.studentId}`,
      count: drafts.length,
      tone: "warning",
    });
  }

  if (incompleteProfiles.length) {
    items.push({
      id: "profile",
      label: "Profil belajar belum lengkap",
      detail: `${incompleteProfiles.length} siswa belum punya bentuk interaksi yang tercatat, sehingga adaptasi bisa kurang tepat.`,
      href: "/dashboard/siswa",
      count: incompleteProfiles.length,
      tone: "warning",
    });
  }

  if (failedAssets.length) {
    items.push({
      id: "visual",
      label: "Ilustrasi gagal dibuat",
      detail: `${failedAssets.length} ilustrasi perlu dibuat ulang atau diunggah manual.`,
      href: "/dashboard/materi",
      count: failedAssets.length,
      tone: "destructive",
    });
  }

  if (ppiDrafts.length) {
    items.push({
      id: "ppi",
      label: "Dokumen PPI masih draft",
      detail: `${ppiDrafts.length} dokumen PPI belum difinalkan dan diekspor ke PDF.`,
      href: "/dashboard/ppi",
      count: ppiDrafts.length,
      tone: "info",
    });
  }

  if (inactiveTokens.length) {
    items.push({
      id: "token",
      label: "Token akses nonaktif",
      detail: `${inactiveTokens.length} siswa tidak bisa membuka materi lewat QR. Aktifkan kembali dari halaman kelas bila sudah dipakai lagi.`,
      href: "/dashboard/kelas",
      count: inactiveTokens.length,
      tone: "destructive",
    });
  }

  return items;
}

export type ClassWithMeta = ClassRoom & {
  studentCount: number;
  materialCount: number;
  activeTokens: number;
};

export async function getClassesWithMeta(): Promise<ClassWithMeta[]> {
  return Promise.all(
    classes.map(async (c) => ({
      ...c,
      studentCount: (await getClassStudents(c.id)).length,
      materialCount: (await getClassMaterials(c.id)).length,
      activeTokens: (await getTokens(c.id)).filter((t) => t.isActive).length,
    })),
  );
}