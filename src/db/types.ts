/**
 * Domain types untuk schema Drizzle di src/db/schema.ts (PRD Bab 10).
 * File ini adalah sumber kebenaran bentuk data; src/lib/dummy/types.ts
 * hanya re-export sehingga import lama tetap berjalan.
 *
 * Catatan pemetaan ke kolom database:
 * - kolom yang boleh NULL di DB dikembalikan sebagai string kosong atau 0
 *   oleh query layer, supaya komponen tidak perlu handling null baru;
 * - `StudentAccessToken.token` tidak pernah disimpan di database, hanya
 *   SHA-256 hash-nya (PRD Bab 8).
 */

export type UserRole = "teacher" | "student";

export type DisabilityType =
  | "tunanetra"
  | "tunarungu"
  | "tunagrahita"
  | "tunadaksa"
  | "tunalaras"
  | "autis"
  | "tunawicara"
  | "tunaganda"
  | "lainnya";

export type MaterialSource = "pdf" | "docx" | "text";
export type MaterialStatus = "draft" | "pending_ai" | "ai_ready" | "published";
export type AdaptationStatus =
  | "generating"
  | "draft"
  | "edited"
  | "approved"
  | "rejected"
  | "failed";
export type VisualAssetStatus =
  | "pending"
  | "generating"
  | "ready"
  | "failed"
  | "rejected";
export type AudioSpeed = "slow" | "normal" | "fast";
export type NavStyle = "step" | "scroll" | "tap";

export interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  role: UserRole;
  schoolName: string;
  city: string;
  subjects: string[];
  photoUrl: string;
  onboardingCompleted: boolean;
}

export interface Student {
  id: string;
  teacherId: string;
  fullName: string;
  nickname: string;
  age: number;
  gender: "L" | "P";
  photoUrl: string;
  disabilityType: DisabilityType;
  notes: string;
  createdAt: string;
}

export type SkillLevel = "low" | "medium" | "high";

export interface StudentUiTokens {
  fontSize: SkillLevel;
  contrastMode: "normal" | "high";
  audioEnabled: boolean;
  audioSpeed: AudioSpeed;
  navStyle: NavStyle;
}

export interface StudentProfile {
  studentId: string;
  academicLevel: SkillLevel;
  academicDetails: {
    membaca: SkillLevel;
    menulis: SkillLevel;
    berhitung: SkillLevel;
    catatan?: string;
  };
  socialEmotional: {
    mengenaliOrang: SkillLevel;
    bekerjaSama: SkillLevel;
    mengaturEmosi: SkillLevel;
    catatan: string;
  };
  motorSkills: {
    motorHalus: SkillLevel;
    motorKasar: SkillLevel;
    catatan: string;
  };
  independence: {
    dressed: SkillLevel;
    makan: SkillLevel;
    menggunakanAlat: SkillLevel;
    catatan: string;
  };
  learningPreferences: {
    visual: boolean;
    audio: boolean;
    kinestetik: boolean;
  };
  interactionModes: {
    touch: boolean;
    speech: boolean;
    keyboard: boolean;
    switch: boolean;
    drag: boolean;
  };
  uiTokens: StudentUiTokens;
  updatedAt: string;
}

export interface ClassRoom {
  id: string;
  teacherId: string;
  name: string;
  subject: string;
  grade: string;
  description: string;
  room: string;
  createdAt: string;
}

export interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: string;
}

export interface MaterialSection {
  title: string;
  summary: string;
  keyTerms: string[];
}

export interface MaterialAnalysis {
  structure: MaterialSection[];
  estimatedReadingLevel: string;
  visualSections: number[];
  summary: string;
}

export interface Material {
  id: string;
  teacherId: string;
  classId: string | null;
  title: string;
  subject: string;
  sourceType: MaterialSource;
  sourceFileName: string;
  sourceText: string;
  status: MaterialStatus;
  aiAnalysis: MaterialAnalysis | null;
  createdAt: string;
}

export interface InteractionOption {
  id: string;
  label: string;
  correct: boolean;
  imageUrl?: string;
}

export interface AdaptedInteraction {
  kind: "tap" | "speech" | "drag" | "text";
  prompt: string;
  options: InteractionOption[];
  acceptedAnswers: string[];
}

export interface AdaptedMedia {
  assetId: string | null;
  altText: string;
}

export interface AdaptedSection {
  index: number;
  title: string;
  body: string[];
  media: AdaptedMedia[];
  interactions: AdaptedInteraction[];
  audioScript: string;
}

export interface AdaptedContent {
  sections: AdaptedSection[];
  readingLevel: string;
  generatedFor: string;
}

export interface MaterialAdaptation {
  id: string;
  materialId: string;
  studentId: string;
  /** Nomor versi; regenerasi menambah satu tanpa menghapus versi lama. */
  version: number;
  status: AdaptationStatus;
  adaptedContent: AdaptedContent;
  aiModel: string;
  aiPromptSnapshot: string;
  teacherEdits: { at: string; note: string; sectionIndex: number }[];
  approvedAt: string | null;
  createdAt: string;
}

export interface VisualAsset {
  id: string;
  materialAdaptationId: string;
  sectionIndex: number;
  prompt: string;
  model: string;
  altText: string;
  status: VisualAssetStatus;
  imageUrl: string | null;
  createdAt: string;
}

export interface StudentAccessToken {
  id: string;
  studentId: string;
  classId: string;
  token: string;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt: string | null;
}

export interface LearningSession {
  id: string;
  studentId: string;
  classId: string;
  materialAdaptationId: string | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
}

export interface ProgressRecord {
  id: string;
  sessionId: string;
  studentId: string;
  sectionIndex: number;
  interactionType: "touch" | "speech" | "drag" | "text" | "switch";
  response: string;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  createdAt: string;
}

export interface PpiDocument {
  id: string;
  teacherId: string;
  studentId: string;
  academicYear: string;
  status: "draft" | "final";
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  content: PpiContent;
}

export interface PpiContent {
  strengths: string;
  needs: string[];
  objectives: string[];
  services: string[];
  schedule: { day: string; time: string; activity: string }[];
  materials: string[];
  evaluation: string;
  familyNotes: string;
  teacherSignature: string;
  headmasterSignature: string;
}

export type NotificationType = "ai_done" | "review" | "session" | "profile" | "system";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  link: string;
  isRead: boolean;
  createdAt: string;
}