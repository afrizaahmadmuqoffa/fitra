/**
 * Skema database Fitra (PRD Bab 10).
 *
 * Deviasi dari draf PRD yang perlu diketahui:
 * 1. Semua `timestamp` memakai `mode: "string"` + `withTimezone` supaya
 *    query layer mengembalikan ISO string dan komponen-komponen Tahap 1
 *    yang memanggil `formatTanggal(...)` tidak berubah.
 * 2. Kolom `jsonb` diberi `$type<...>()` dari src/db/types.ts.
 * 3. Kolom tambahan untuk memenuhi UI Tahap 1: `profiles.nickname`,
 *    `profiles.city`, `profiles.subjects`, `profiles.preferences`,
 *    `classes.room`, `materials.source_file_name`,
 *    `student_access_tokens.last_used_at`, `visual_assets.image_url`.
 * 4. Unique composite: satu siswa satu kali per kelas, satu materi satu
 *    adaptasi per siswa.
 * 5. Token QR hanya disimpan sebagai hash SHA-256 (kolom `token_hash`).
 *    Kolom `token` pada tipe StudentAccessToken hanya hidup di memori
 *    server pada satu kali pembuatan (reveal-once).
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  AdaptedContent,
  MaterialAnalysis,
  NotificationType,
  PpiContent,
  StudentProfile,
} from "./types";

const ts = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "string" }).defaultNow().notNull();

const createdAt = () => ts("created_at");

export const userRoleEnum = pgEnum("user_role", ["teacher", "student"]);

export const disabilityTypeEnum = pgEnum("disability_type", [
  "tunanetra",
  "tunarungu",
  "tunagrahita",
  "tunadaksa",
  "tunalaras",
  "autis",
  "tunawicara",
  "tunaganda",
  "lainnya",
]);

export const materialSourceEnum = pgEnum("material_source", ["pdf", "docx", "text"]);

export const materialStatusEnum = pgEnum("material_status", [
  "draft",
  "pending_ai",
  "ai_ready",
  "published",
]);

export const adaptationStatusEnum = pgEnum("adaptation_status", [
  "generating",
  "draft",
  "edited",
  "approved",
  "rejected",
]);

/** =========================================================
 *  PROFILES — memperluas auth.users dari Supabase
 *  ========================================================= */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    role: userRoleEnum("role").notNull().default("teacher"),
    avatarUrl: text("avatar_url"),
    schoolName: text("school_name"),
    nickname: text("nickname"),
    city: text("city"),
    subjects: jsonb("subjects").$type<string[]>(),
    preferences: jsonb("preferences").$type<ProfilePreferences>(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("profiles_email_idx").on(table.email)],
);

export type ProfilePreferences = {
  notifyAiDone: boolean;
  notifyReview: boolean;
  notifySession: boolean;
  dailyDigest: boolean;
};

/** =========================================================
 *  STUDENTS — siswa yang dikelola guru
 *  ========================================================= */
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    fullName: text("full_name").notNull(),
    nickname: text("nickname"),
    age: integer("age"),
    gender: varchar("gender", { length: 16 }),
    photoUrl: text("photo_url"),
    disabilityType: disabilityTypeEnum("disability_type").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (table) => [index("students_teacher_idx").on(table.teacherId)],
);

/** =========================================================
 *  STUDENT_PROFILES — profil belajar individual siswa
 *  ========================================================= */
export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  academicLevel: varchar("academic_level", { length: 32 }),
  academicDetails: jsonb("academic_details").$type<StudentProfile["academicDetails"]>(),
  socialEmotional: jsonb("social_emotional").$type<StudentProfile["socialEmotional"]>(),
  motorSkills: jsonb("motor_skills").$type<StudentProfile["motorSkills"]>(),
  independence: jsonb("independence").$type<StudentProfile["independence"]>(),
  learningPreferences: jsonb("learning_preferences").$type<StudentProfile["learningPreferences"]>(),
  interactionModes: jsonb("interaction_modes").$type<StudentProfile["interactionModes"]>(),
  uiTokens: jsonb("ui_tokens").$type<StudentProfile["uiTokens"]>(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

/** =========================================================
 *  CLASSES — kelas yang dibuat guru
 *  ========================================================= */
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    subject: text("subject"),
    grade: varchar("grade", { length: 32 }),
    description: text("description"),
    room: text("room"),
    createdAt: createdAt(),
  },
  (table) => [index("classes_teacher_idx").on(table.teacherId)],
);

/** =========================================================
 *  CLASS_STUDENTS — relasi many-to-many kelas-siswa
 *  ========================================================= */
export const classStudents = pgTable(
  "class_students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: ts("joined_at"),
  },
  (table) => [
    uniqueIndex("class_students_unique_idx").on(table.classId, table.studentId),
    index("class_students_student_idx").on(table.studentId),
  ],
);

/** =========================================================
 *  MATERIALS — materi asli yang diunggah guru
 *  ========================================================= */
export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    subject: text("subject"),
    sourceType: materialSourceEnum("source_type").notNull(),
    sourceUrl: text("source_url"),
    sourceText: text("source_text"),
    sourceFileName: text("source_file_name"),
    aiAnalysis: jsonb("ai_analysis").$type<MaterialAnalysis>(),
    status: materialStatusEnum("status").notNull().default("draft"),
    createdAt: createdAt(),
  },
  (table) => [
    index("materials_teacher_idx").on(table.teacherId),
    index("materials_class_idx").on(table.classId),
  ],
);

/** =========================================================
 *  MATERIAL_ADAPTATIONS — versi adaptasi per siswa
 *  ========================================================= */
export const materialAdaptations = pgTable(
  "material_adaptations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialId: uuid("material_id")
      .references(() => materials.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    status: adaptationStatusEnum("status").notNull().default("generating"),
    adaptedContent: jsonb("adapted_content").$type<AdaptedContent>(),
    aiModel: text("ai_model"),
    aiPromptSnapshot: text("ai_prompt_snapshot"),
    teacherEdits: jsonb("teacher_edits").$type<
      { at: string; note: string; sectionIndex: number }[]
    >(),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("material_adaptations_unique_idx").on(table.materialId, table.studentId),
    index("material_adaptations_student_idx").on(table.studentId),
    index("material_adaptations_status_idx").on(table.status),
  ],
);

/** =========================================================
 *  VISUAL_ASSETS — aset visual hasil generasi Pollinations AI
 *  ========================================================= */
export const visualAssets = pgTable(
  "visual_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    materialAdaptationId: uuid("material_adaptation_id")
      .references(() => materialAdaptations.id, { onDelete: "cascade" })
      .notNull(),
    sectionIndex: integer("section_index").notNull(),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    altText: text("alt_text").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("pending"),
    providerRequestId: text("provider_request_id"),
    sourceHash: varchar("source_hash", { length: 128 }),
    imageUrl: text("image_url"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("visual_assets_adaptation_idx").on(table.materialAdaptationId)],
);

/** STUDENT_ACCESS_TOKENS — token QR per siswa per kelas (hash SHA-256) */
export const studentAccessTokens = pgTable(
  "student_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    classId: uuid("class_id")
      .references(() => classes.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("student_access_tokens_class_idx").on(table.classId),
    index("student_access_tokens_student_idx").on(table.studentId),
  ],
);

/** =========================================================
 *  LEARNING_SESSIONS — sesi belajar siswa
 *  ========================================================= */
export const learningSessions = pgTable(
  "learning_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    materialAdaptationId: uuid("material_adaptation_id").references(
      () => materialAdaptations.id,
      { onDelete: "set null" },
    ),
    startedAt: ts("started_at"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    durationSeconds: integer("duration_seconds"),
  },
  (table) => [
    index("learning_sessions_student_idx").on(table.studentId),
    index("learning_sessions_started_idx").on(table.startedAt),
  ],
);

/** =========================================================
 *  PROGRESS_RECORDS — detail interaksi siswa per section
 *  ========================================================= */
export const progressRecords = pgTable(
  "progress_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => learningSessions.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    sectionIndex: integer("section_index").notNull(),
    interactionType: varchar("interaction_type", { length: 32 }),
    response: jsonb("response"),
    isCorrect: boolean("is_correct"),
    timeSpentSeconds: integer("time_spent_seconds"),
    createdAt: createdAt(),
  },
  (table) => [
    index("progress_records_student_idx").on(table.studentId),
    index("progress_records_session_idx").on(table.sessionId),
  ],
);

/** =========================================================
 *  PPI_DOCUMENTS — dokumen Program Pendidikan Individual
 *  ========================================================= */
export const ppiDocuments = pgTable(
  "ppi_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id, { onDelete: "cascade" })
      .notNull(),
    academicYear: varchar("academic_year", { length: 16 }),
    content: jsonb("content").$type<PpiContent>(),
    status: varchar("status", { length: 24 }).notNull().default("draft"),
    pdfUrl: text("pdf_url"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("ppi_documents_student_idx").on(table.studentId)],
);

/** =========================================================
 *  NOTIFICATIONS — notifikasi in-app
 *  ========================================================= */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    body: text("body"),
    type: varchar("type", { length: 32 }).notNull().default("info"),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [index("notifications_user_idx").on(table.userId, table.createdAt)],
);

export const notificationTypeValues = [
  "ai_done",
  "review",
  "session",
  "profile",
  "system",
  "info",
] as const satisfies readonly (NotificationType | "info")[];