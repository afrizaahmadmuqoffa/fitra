/**
 * Seed data minimal ke Supabase.
 *
 * Isi: 1 guru, 2 siswa + profil belajar, 1 kelas, 2 materi, 2 adaptasi,
 * aset visual, 2 token QR (1 nonaktif), 3 sesi belajar, 6 progres,
 * 1 dokumen PPI, 3 notifikasi. Semua berbahasa Indonesia realistis dan
 * diambil dari lapisan dummy Tahap 1 supaya konsisten dengan UI.
 *
 * Jalankan:  npx tsx scripts/seed.ts
 * Idempoten: data lama untuk guru yang sama dibersihkan lebih dulu.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

function loadEnvFile() {
  const file = join(process.cwd(), ".env.local");
  try {
    const content = readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!match) continue;
      const value = match[2].trim();
      if (!process.env[match[1]]) {
        process.env[match[1]] = value.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Andalkan env yang sudah ada di shell.
  }
}
loadEnvFile();

import { getDb } from "../src/db/client";
import {
  classStudents as classStudentsTable,
  classes as classesTable,
  learningSessions as sessionsTable,
  materialAdaptations,
  materials as materialsTable,
  notifications as notificationsTable,
  ppiDocuments as ppiTable,
  profiles,
  progressRecords as recordsTable,
  studentAccessTokens,
  studentProfiles as studentProfilesTable,
  students as studentsTable,
  visualAssets as visualAssetsTable,
} from "../src/db/schema";
import { classes, classStudents } from "../src/lib/dummy/classes";
import {
  learningSessions,
  notifications,
  ppiDocuments,
  progressRecords,
  studentTokens,
} from "../src/lib/dummy/learning";
import { adaptations, materials, visualAssets } from "../src/lib/dummy/materials";
import { studentProfiles, students, teacher } from "../src/lib/dummy/people";
import { generateToken, hashToken } from "../src/lib/tokens";

const TEACHER_EMAIL = "sri.wahyuni@slb1yogya.sch.id";
const TEACHER_PASSWORD = "fitra2026";
const KEEP_STUDENTS = ["stu-aisyah", "stu-bagas"];
const KEEP_CLASSES = ["cls-iv-b"];
const KEEP_MATERIALS = ["mat-angka", "mat-warna"];

/** Data dummy sudah memakai ISO dengan offset; tambahkan +07:00 bila belum ada. */
function toIso(value: string): string {
  const trimmed = value.trim();
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(trimmed)) return trimmed;
  const iso = trimmed.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return `${iso}T00:00:00+07:00`;
  return `${iso}+07:00`;
}

async function main() {
  const db = getDb();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 1. Akun guru (Supabase Auth + trigger otomatis mengisi tabel profiles).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: teacher.fullName,
      nickname: teacher.nickname,
      school_name: teacher.schoolName,
      city: teacher.city,
    },
  });

  let teacherId = created.user?.id;
  if (createError || !teacherId) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((user) => user.email === TEACHER_EMAIL);
    if (!existing) throw createError ?? new Error("Akun guru tidak bisa dibuat.");
    teacherId = existing.id;
    await admin.auth.admin.updateUserById(existing.id, {
      password: TEACHER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: teacher.fullName,
        nickname: teacher.nickname,
        school_name: teacher.schoolName,
        city: teacher.city,
      },
    });
  }

  // Seed idempoten: hapus data lama milik guru ini (cascade ke semua tabel).
  await db.delete(profiles).where(eq(profiles.id, teacherId));

  await db
    .insert(profiles)
    .values({
      id: teacherId,
      email: teacher.email,
      fullName: teacher.fullName,
      nickname: teacher.nickname,
      schoolName: teacher.schoolName,
      city: teacher.city,
      subjects: teacher.subjects,
      avatarUrl: teacher.photoUrl,
      role: "teacher",
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email: teacher.email,
        fullName: teacher.fullName,
        nickname: teacher.nickname,
        schoolName: teacher.schoolName,
        city: teacher.city,
        subjects: teacher.subjects,
        avatarUrl: teacher.photoUrl,
        updatedAt: new Date().toISOString(),
      },
    });

  console.log(`guru      : ${teacher.fullName} (${teacherId})`);

  // 2. Siswa + profil belajar.
  const studentIdMap = new Map<string, string>();
  for (const dummy of students.filter((item) => KEEP_STUDENTS.includes(item.id))) {
    const [row] = await db
      .insert(studentsTable)
      .values({
        teacherId,
        fullName: dummy.fullName,
        nickname: dummy.nickname,
        age: dummy.age,
        gender: dummy.gender,
        photoUrl: dummy.photoUrl,
        disabilityType: dummy.disabilityType,
        notes: dummy.notes,
        createdAt: toIso(dummy.createdAt),
      })
      .returning({ id: studentsTable.id });
    studentIdMap.set(dummy.id, row.id);

    const profile = studentProfiles.find((item) => item.studentId === dummy.id);
    if (profile) {
      await db.insert(studentProfilesTable).values({
        studentId: row.id,
        academicLevel: profile.academicLevel,
        academicDetails: profile.academicDetails,
        socialEmotional: profile.socialEmotional,
        motorSkills: profile.motorSkills,
        independence: profile.independence,
        learningPreferences: profile.learningPreferences,
        interactionModes: profile.interactionModes,
        uiTokens: profile.uiTokens,
        updatedAt: profile.updatedAt,
      });
    }
    console.log(`siswa     : ${dummy.fullName} (${row.id})`);
  }

  // 3. Kelas + anggota.
  const classIdMap = new Map<string, string>();
  for (const dummy of classes.filter((item) => KEEP_CLASSES.includes(item.id))) {
    const [row] = await db
      .insert(classesTable)
      .values({
        teacherId,
        name: dummy.name,
        subject: dummy.subject,
        grade: dummy.grade,
        description: dummy.description,
        room: dummy.room,
        createdAt: toIso(dummy.createdAt),
      })
      .returning({ id: classesTable.id });
    classIdMap.set(dummy.id, row.id);
    console.log(`kelas     : ${dummy.name} (${row.id})`);
  }

  for (const member of classStudents) {
    const classId = classIdMap.get(member.classId);
    const studentId = studentIdMap.get(member.studentId);
    if (!classId || !studentId) continue;
    await db.insert(classStudentsTable).values({
      classId,
      studentId,
      joinedAt: toIso(member.joinedAt),
    });
  }

  // 4. Materi.
  const materialIdMap = new Map<string, string>();
  for (const dummy of materials.filter((item) => KEEP_MATERIALS.includes(item.id))) {
    const [row] = await db
      .insert(materialsTable)
      .values({
        teacherId,
        classId: classIdMap.get(dummy.classId ?? "") ?? null,
        title: dummy.title,
        subject: dummy.subject,
        sourceType: dummy.sourceType,
        sourceText: dummy.sourceText,
        sourceFileName: dummy.sourceFileName,
        aiAnalysis: dummy.aiAnalysis,
        status: dummy.status,
        createdAt: toIso(dummy.createdAt),
      })
      .returning({ id: materialsTable.id });
    materialIdMap.set(dummy.id, row.id);
    console.log(`materi    : ${dummy.title} (${dummy.status})`);
  }

  // 5. Adaptasi per siswa. Aisyah approved, Bagas masih draft supaya ada
  //    satu item "menunggu review" di dasbor.
  const adaptationIdMap = new Map<string, string>();
  const pending = adaptations.filter(
    (item) =>
      materialIdMap.has(item.materialId) && studentIdMap.has(item.studentId),
  );

  for (const dummy of pending) {
    const status = dummy.studentId === "stu-bagas" ? "draft" : dummy.status;
    const [row] = await db
      .insert(materialAdaptations)
      .values({
        materialId: materialIdMap.get(dummy.materialId)!,
        studentId: studentIdMap.get(dummy.studentId)!,
        version: dummy.version,
        status,
        adaptedContent: {
          ...dummy.adaptedContent,
          sections: dummy.adaptedContent.sections.map((section) => ({
            ...section,
            media: section.media.map((media) => ({ ...media, assetId: null })),
          })),
        },
        aiModel: dummy.aiModel,
        aiPromptSnapshot: dummy.aiPromptSnapshot,
        teacherEdits: dummy.teacherEdits,
        approvedAt: status === "approved" ? toIso(dummy.approvedAt ?? "") : null,
        createdAt: toIso(dummy.createdAt),
      })
      .returning({ id: materialAdaptations.id });
    adaptationIdMap.set(dummy.id, row.id);
    console.log(`adaptasi  : ${dummy.id} -> ${status}`);
  }

  // 6. Aset visual + penulisan ulang assetId di konten adaptasi.
  const assetIdMap = new Map<string, string>();
  for (const dummy of visualAssets) {
    const adaptationId = adaptationIdMap.get(dummy.materialAdaptationId);
    if (!adaptationId) continue;
    const [row] = await db
      .insert(visualAssetsTable)
      .values({
        materialAdaptationId: adaptationId,
        sectionIndex: dummy.sectionIndex,
        prompt: dummy.prompt,
        model: dummy.model,
        storagePath: `${dummy.materialAdaptationId}/${dummy.sectionIndex}.png`,
        mimeType: "image/png",
        altText: dummy.altText,
        status: dummy.status,
        imageUrl: dummy.imageUrl,
        createdAt: toIso(dummy.createdAt),
      })
      .returning({ id: visualAssetsTable.id });
    assetIdMap.set(dummy.id, row.id);
  }

  for (const dummy of pending) {
    const adaptationId = adaptationIdMap.get(dummy.id);
    if (!adaptationId) continue;
    const hasAsset = dummy.adaptedContent.sections.some((section) =>
      section.media.some((media) => media.assetId && assetIdMap.has(media.assetId)),
    );
    if (!hasAsset) continue;
    const content = {
      ...dummy.adaptedContent,
      sections: dummy.adaptedContent.sections.map((section) => ({
        ...section,
        media: section.media.map((media) => ({
          ...media,
          assetId: media.assetId ? (assetIdMap.get(media.assetId) ?? null) : null,
        })),
      })),
    };
    await db
      .update(materialAdaptations)
      .set({ adaptedContent: content })
      .where(eq(materialAdaptations.id, adaptationId));
  }
  console.log(`aset visual: ${assetIdMap.size} berkas`);

  // 7. Token QR: hash SHA-256 yang disimpan, teks asli dicetak ke console.
  const plainTokens: { student: string; token: string; active: boolean }[] = [];
  for (const dummy of studentTokens) {
    const studentId = studentIdMap.get(dummy.studentId);
    const classId = classIdMap.get(dummy.classId);
    if (!studentId || !classId) continue;
    await db.insert(studentAccessTokens).values({
      studentId,
      classId,
      tokenHash: hashToken(dummy.token),
      isActive: dummy.studentId === "stu-bagas" ? false : dummy.isActive,
      expiresAt: toIso(dummy.expiresAt),
      lastUsedAt: dummy.lastUsedAt ? toIso(dummy.lastUsedAt) : null,
    });
    plainTokens.push({
      student: dummy.studentId,
      token: dummy.token,
      active: dummy.studentId === "stu-bagas" ? false : dummy.isActive,
    });
  }

  // 8. Sesi belajar + progres.
  const sessionIdMap = new Map<string, string>();
  const keepSessions = learningSessions.filter((item) =>
    studentIdMap.has(item.studentId),
  );
  for (const dummy of keepSessions) {
    const [row] = await db
      .insert(sessionsTable)
      .values({
        studentId: studentIdMap.get(dummy.studentId)!,
        classId: classIdMap.get(dummy.classId) ?? null,
        materialAdaptationId: dummy.materialAdaptationId
          ? (adaptationIdMap.get(dummy.materialAdaptationId) ?? null)
          : null,
        startedAt: toIso(dummy.startedAt),
        completedAt: dummy.completedAt ? toIso(dummy.completedAt) : null,
        durationSeconds: dummy.durationSeconds,
      })
      .returning({ id: sessionsTable.id });
    sessionIdMap.set(dummy.id, row.id);
  }

  const keepSessionIds = Array.from(sessionIdMap.values());
  if (keepSessionIds.length > 0) {
    const records = progressRecords
      .filter((item) => sessionIdMap.has(item.sessionId))
      .map((item) => ({
        sessionId: sessionIdMap.get(item.sessionId)!,
        studentId: studentIdMap.get(item.studentId)!,
        sectionIndex: item.sectionIndex,
        interactionType: item.interactionType,
        response: item.response,
        isCorrect: item.isCorrect,
        timeSpentSeconds: item.timeSpentSeconds,
        createdAt: toIso(item.createdAt),
      }));
    if (records.length > 0) await db.insert(recordsTable).values(records);
    console.log(`sesi      : ${keepSessions.length} sesi, ${records.length} progres`);
  }

  // 9. PPI + notifikasi.
  for (const dummy of ppiDocuments) {
    const studentId = studentIdMap.get(dummy.studentId);
    if (!studentId) continue;
    await db.insert(ppiTable).values({
      teacherId,
      studentId,
      academicYear: dummy.academicYear,
      content: dummy.content,
      status: dummy.status,
      pdfUrl: dummy.pdfUrl,
      createdAt: toIso(dummy.createdAt),
      updatedAt: toIso(dummy.updatedAt),
    });
  }

  const seededNotifications = notifications.slice(0, 3);
  for (const dummy of seededNotifications) {
    await db.insert(notificationsTable).values({
      userId: teacherId,
      title: dummy.title,
      body: dummy.body,
      type: dummy.type,
      // Link dummy memakai id siswa karangan (stu-…), jadi dialihkan ke
      // daftar siswa yang benar-benar ada di database.
      link: dummy.link.startsWith("/dashboard/siswa/")
        ? "/dashboard/siswa"
        : dummy.link,
      isRead: dummy.isRead,
      createdAt: dummy.createdAt,
    });
  }

  // 10. Token pratinjau untuk kelas IV-B supaya guru bisa langsung mencoba
  //     Mode Simulasi Profil tanpa menunggu rotasi manual.
  const previewToken = generateToken();
  const bagasRow = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.id, studentIdMap.get("stu-bagas")!));
  const classRow = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.id, classIdMap.get("cls-iv-b")!));
  if (bagasRow[0] && classRow[0]) {
    await db.insert(studentAccessTokens).values({
      studentId: bagasRow[0].id,
      classId: classRow[0].id,
      tokenHash: hashToken(previewToken),
      isActive: true,
      expiresAt: "2027-06-30T23:59:59+00:00",
    });
    plainTokens.push({ student: "stu-bagas", token: previewToken, active: true });
  }

  console.log("\n=== TOKEN QR (database hanya menyimpan hash) ===");
  for (const item of plainTokens) {
    const label =
      item.student === "stu-aisyah"
        ? "Aisyah Putri Ramadhani"
        : item.student === "stu-bagas"
          ? "Bagas Santoso"
          : item.student;
    console.log(
      `${label.padEnd(24)} ${item.token}  ${item.active ? "aktif" : "nonaktif"}`,
    );
  }
  writeSeedTokens(plainTokens);

  console.log(
    `\nBuka /belajar/<token> untuk mencoba alur siswa. Kredensial guru: ${TEACHER_EMAIL} / ${TEACHER_PASSWORD}`,
  );
}

/**
 * Token plaintext ditulis ke file lokal supaya bisa dipakai smoke test dan
 * demo. File ini tidak pernah masuk database dan sudah masuk .gitignore.
 */
function writeSeedTokens(tokens: { student: string; token: string; active: boolean }[]) {
  const file = join(process.cwd(), ".seed-tokens.json");
  writeFileSync(file, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("seed gagal:", error);
    process.exit(1);
  });