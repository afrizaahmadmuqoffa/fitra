import { z } from "zod";

export const disabilityTypeSchema = z.enum([
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

export const skillLevelSchema = z.enum(["low", "medium", "high"]);

export const studentIdentitySchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama terlalu panjang"),
  nickname: z.string().max(24).optional().or(z.literal("")),
  age: z.coerce
    .number()
    .int()
    .min(3, "Usia minimal 3 tahun")
    .max(25, "Usia maksimal 25 tahun"),
  gender: z.enum(["L", "P"]),
  disabilityType: disabilityTypeSchema,
  notes: z.string().max(400).optional().or(z.literal("")),
});
export type StudentIdentityInput = z.infer<typeof studentIdentitySchema>;

export const studentProfileSchema = z.object({
  academicLevel: skillLevelSchema,
  membaca: skillLevelSchema,
  menulis: skillLevelSchema,
  berhitung: skillLevelSchema,
  mengenaliOrang: skillLevelSchema,
  bekerjaSama: skillLevelSchema,
  mengaturEmosi: skillLevelSchema,
  motorHalus: skillLevelSchema,
  motorKasar: skillLevelSchema,
  dressed: skillLevelSchema,
  makan: skillLevelSchema,
  menggunakanAlat: skillLevelSchema,
  preferences: z.array(z.enum(["visual", "audio", "kinestetik"])).min(
    1,
    "Pilih minimal satu preferensi belajar",
  ),
  interactions: z
    .array(z.enum(["touch", "speech", "keyboard", "switch", "drag"]))
    .min(1, "Pilih minimal satu bentuk interaksi"),
  fontSize: skillLevelSchema,
  contrastMode: z.enum(["normal", "high"]),
  audioEnabled: z.boolean(),
  audioSpeed: z.enum(["slow", "normal", "fast"]),
  navStyle: z.enum(["step", "scroll", "tap"]),
});
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export const materialUploadSchema = z.object({
  title: z.string().min(3, "Judul materi minimal 3 karakter").max(120),
  subject: z.string().min(2, "Pilih mata pelajaran"),
  classId: z.string().min(1, "Pilih kelas target"),
  sourceType: z.enum(["pdf", "docx", "text"]),
  sourceText: z
    .string()
    .max(20000, "Teks maksimal 20.000 karakter")
    .optional()
    .or(z.literal("")),
  targetStudentIds: z.array(z.string()).optional(),
});
export type MaterialUploadInput = z.infer<typeof materialUploadSchema>;

export const classSchema = z.object({
  name: z.string().min(3, "Nama kelas minimal 3 karakter").max(80),
  subject: z.string().min(2, "Mata pelajaran wajib diisi").max(80),
  grade: z.string().min(1, "Tingkat kelas wajib diisi").max(32),
  room: z.string().max(60).optional().or(z.literal("")),
  description: z.string().max(400).optional().or(z.literal("")),
});
export type ClassInput = z.infer<typeof classSchema>;

export const loginSchema = z.object({
  email: z.email("Format email belum benar"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(80),
  schoolName: z.string().min(2, "Nama sekolah wajib diisi").max(120),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const ppiSchema = z.object({
  strengths: z.string().min(10, "Tuliskan kekuatan siswa minimal 10 karakter"),
  needs: z.array(z.string().min(3)).min(1, "Cantumkan minimal satu kebutuhan"),
  objectives: z.array(z.string().min(10)).min(1, "Cantumkan minimal satu tujuan"),
  services: z.array(z.string().min(3)).min(1, "Cantumkan minimal satu layanan"),
  evaluation: z.string().min(10, "Rencana evaluasi minimal 10 karakter"),
  familyNotes: z.string().max(600).optional().or(z.literal("")),
});
export type PpiInput = z.infer<typeof ppiSchema>;

export const accountSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter").max(80),
  email: z.email("Format email belum benar"),
  schoolName: z.string().min(2, "Nama sekolah wajib diisi").max(120),
  city: z.string().max(60).optional().or(z.literal("")),
});
export type AccountInput = z.infer<typeof accountSchema>;