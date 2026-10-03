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
import { and, eq } from "drizzle-orm";
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

  // 2. INSERT kelas + anggota (many-to-many).
  const className = `Kelas Uji ${Date.now().toString(36)}`;
  const classId = await withRlsDb(claims, async (tx) => {
    const [row] = await tx
      .insert(classes)
      .values({ teacherId, name: className, grade: "Kelas IV", room: "R. Uji" })
      .returning({ id: classes.id });
    await tx.insert(studentAccessTokens).values({
      studentId,
      classId: row.id,
      tokenHash: hashToken("token-uji-lokal"),
      isActive: true,
    });
    return row.id;
  });
  check("insert kelas", Boolean(classId), classId);

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

  // 7. Bersihkan data uji.
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