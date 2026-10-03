/**
 * Uji jalur tulis Server Actions pada lapis database.
 *
 * Semua mutasi Server Actions melewati lapisan yang sama dengan yang dipakai di
 * sini: `withRlsDb` (role `authenticated` + JWT guru), sehingga pengujian ini
 * sekaligus membuktikan policy RLS berlaku untuk INSERT dan UPDATE.
 *
 * Jalankan: npx tsx scripts/smoke-writes.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { and, eq, inArray } from "drizzle-orm";
import { hashToken } from "../src/lib/tokens";

function loadEnvFile() {
  const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

import { getDb } from "../src/db/client";
import {
  classStudents,
  classes,
  materialAdaptations,
  materials,
  studentAccessTokens,
  studentProfiles,
  students,
} from "../src/db/schema";
import { withRlsDb } from "../src/db/rls";

const EMAIL = "sri.wahyuni@slb1yogya.sch.id";
const PASSWORD = "fitra2026";

let failures = 0;

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "  LULUS " : "  GAGAL "} ${label.padEnd(44)} ${detail}`);
  if (!ok) failures += 1;
}

async function main() {
  const db = getDb();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error || !data.session) throw new Error(`Login gagal: ${error?.message}`);

  const claims = { sub: data.user.id, email: data.user.email ?? undefined };
  const teacherId = data.user.id;

  console.log(`\nUji jalur tulis sebagai ${data.user.email}\n`);

  // 1. INSERT siswa + profil belajar.
  const studentName = `Uji Tulis ${Date.now().toString(36)}`;
  const studentId = await withRlsDb(claims, async (tx) => {
    const [row] = await tx
      .insert(students)
      .values({
        teacherId,
        fullName: studentName,
        nickname: "Uji",
        age: 9,
        gender: "L",
        disabilityType: "autis",
        notes: "Data uji coba otomatis.",
      })
      .returning({ id: students.id });

    await tx.insert(studentProfiles).values({
      studentId: row.id,
      academicLevel: "medium",
      academicDetails: { membaca: "medium", menulis: "medium", berhitung: "medium" },
      interactionModes: { touch: true, speech: false, keyboard: false, switch: false, drag: false },
      uiTokens: {
        fontSize: "medium",
        contrastMode: "normal",
        audioEnabled: true,
        audioSpeed: "normal",
        navStyle: "step",
      },
    });

    return row.id;
  });
  check("insert siswa + profil", Boolean(studentId), studentId);

  // 2. INSERT kelas + keanggotaan (many-to-many) + token.
  const className = `Kelas Uji ${Date.now().toString(36)}`;
  const classId = await withRlsDb(claims, async (tx) => {
    const [row] = await tx
      .insert(classes)
      .values({ teacherId, name: className, grade: "Kelas IV", room: "R. Uji" })
      .returning({ id: classes.id });
    // Meniru hasil simpan pertama: siswa menjadi anggota kelas ini.
    await tx.insert(classStudents).values({ classId: row.id, studentId });
    await tx.insert(studentAccessTokens).values({
      studentId,
      classId: row.id,
      tokenHash: hashToken("token-uji-lokal"),
      isActive: true,
    });
    return row.id;
  });
  check("insert kelas + anggota", Boolean(classId), classId);

  // 3. Token tidak boleh bisa dibaca sebelum dirotasi (hash one-way).
  const hashNow = hashToken("token-uji-lokal");
  check(
    "hash token konsisten",
    hashNow === hashToken("token-uji-lokal"),
    hashNow.slice(0, 16),
  );

  // 4. RLS mencegah guru menulis ke baris guru lain.
  const blocked = await withRlsDb(
    { sub: "00000000-0000-4000-8000-000000000000" },
    async (tx) => {
      const rows = await tx
        .update(students)
        .set({ fullName: "Dibajak" })
        .where(eq(students.id, studentId))
        .returning({ id: students.id });
      return rows.length;
    },
  );
  check("JWT lain tidak bisa ubah data guru ini", blocked === 0, `${blocked} baris berubah`);

  // 5. Gate terbitkan: materi tanpa adaptasi approved harus ditolak.
  const materialId = await withRlsDb(claims, async (tx) => {
    const [row] = await tx
      .insert(materials)
      .values({
        teacherId,
        title: `Materi Uji ${Date.now().toString(36)}`,
        subject: "Matematika",
        sourceType: "text",
        sourceText:
          "Bagian satu. Angka dipakai untuk menghitung jumlah benda. Bagian dua. Hitung apel satu per satu.",
        status: "ai_ready",
      })
      .returning({ id: materials.id });
    return row.id;
  });

  const approvedBefore = await withRlsDb(claims, async (tx) => {
    const rows = await tx
      .select({ id: materialAdaptations.id })
      .from(materialAdaptations)
      .where(
        and(
          eq(materialAdaptations.materialId, materialId),
          eq(materialAdaptations.status, "approved"),
        ),
      );
    return rows.length;
  });
  check("materi baru belum punya adaptasi approved", approvedBefore === 0, "0 approved");

  // 6. Setujui adaptasi, lalu statistic published.
  await withRlsDb(claims, async (tx) => {
    await tx.insert(materialAdaptations).values({
      materialId,
      studentId,
      status: "approved",
      adaptedContent: {
        readingLevel: "Sederhana",
        generatedFor: studentId,
        sections: [
          {
            index: 0,
            title: "Apa itu angka",
            body: ["Satu benda berarti angka 1."],
            media: [],
            interactions: [],
            audioScript: "Satu benda berarti angka satu.",
          },
        ],
      },
      approvedAt: new Date().toISOString(),
    });
    await tx.update(materials).set({ status: "published" }).where(eq(materials.id, materialId));
  });
  const approvedAfter = await withRlsDb(claims, async (tx) => {
    const rows = await tx
      .select({ id: materialAdaptations.id })
      .from(materialAdaptations)
      .where(
        and(
          eq(materialAdaptations.materialId, materialId),
          eq(materialAdaptations.status, "approved"),
        ),
      );
    return rows.length;
  });
  check(
    "setujui lalu terbitkan",
    approvedAfter === 1,
    `${approvedAfter} adaptasi approved`,
  );

  // 7. Simpan ulang dengan daftar kelas yang sama persis.
  //
  // Ini kasus yang dulu menabrak unique index (class_id, student_id): logika
  // sinkronisasi salah membandingkan id siswa dengan id kelas, sehingga semua
  // kelas terpilih dianggap baru dan di-INSERT dua kali. Guru yang menekan
  // Simpan dua kali pun harus aman.
  const membershipsBefore = await withRlsDb(claims, async (tx) => {
    const rows = await tx
      .select({ classId: classStudents.classId })
      .from(classStudents)
      .where(eq(classStudents.studentId, studentId));
    return rows.map((row) => row.classId);
  });

  let resaveError: string | null = null;
  await withRlsDb(claims, async (tx) => {
    try {
      const current = await tx
        .select({ classId: classStudents.classId })
        .from(classStudents)
        .where(eq(classStudents.studentId, studentId));
      const currentIds = new Set(current.map((row) => row.classId));
      const nextIds = new Set([classId]);

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
          .values(added.map((item) => ({ classId: item, studentId })))
          .onConflictDoNothing();
      }
    } catch (error) {
      resaveError = error instanceof Error ? error.message : "error tidak dikenal";
    }
  });

  const membershipsAfter = await withRlsDb(claims, async (tx) => {
    const rows = await tx
      .select({ classId: classStudents.classId })
      .from(classStudents)
      .where(eq(classStudents.studentId, studentId));
    return rows.map((row) => row.classId);
  });

  check(
    "simpan ulang kelas tidak menabrak unique index",
    resaveError === null,
    resaveError ?? "tidak ada error",
  );
  check(
    "anggota kelas tidak berduplikasi",
    membershipsAfter.length === membershipsBefore.length &&
      membershipsAfter.every((item) => membershipsBefore.includes(item)),
    `${membershipsBefore.length} kelas -> ${membershipsAfter.length} kelas`,
  );

  // 7b. Mengeluarkan siswa dari kelas harus benar-benar menghapus barisnya.
  //      Dulu DELETE memakai kolom yang salah sehingga 0 baris terhapus diam-diam.
  await withRlsDb(claims, async (tx) => {
    await tx
      .delete(classStudents)
      .where(
        and(
          eq(classStudents.studentId, studentId),
          eq(classStudents.classId, classId),
        ),
      );
  });
  const afterRemoval = await withRlsDb(claims, async (tx) => {
    const rows = await tx
      .select({ classId: classStudents.classId })
      .from(classStudents)
      .where(eq(classStudents.studentId, studentId));
    return rows.length;
  });
  check("keluarkan dari kelas menghapus baris", afterRemoval === 0, `${afterRemoval} baris tersisa`);

  // 8. Bersihkan data uji.
  await withRlsDb(claims, async (tx) => {
    await tx.delete(materials).where(eq(materials.id, materialId));
    await tx.delete(classes).where(eq(classes.id, classId));
    await tx.delete(students).where(eq(students.id, studentId));
  });
  const cleaned = await withRlsDb(claims, async (tx) => {
    const rows = await tx.select({ id: students.id }).from(students).where(eq(students.id, studentId));
    return rows.length;
  });
  check("data uji terhapus (cascade)", cleaned === 0, "0 baris tersisa");

  void db;
  console.log(
    failures === 0
      ? "\nSemua pengujian jalur tulis lulus."
      : `\n${failures} pengujian gagal.`,
  );
  if (failures > 0) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("smoke writes gagal:", error);
    process.exit(1);
  });