import type { Metadata } from "next";
import Link from "next/link";
import {
  getProgressSummary,
  getSessions,
  getStudentClasses,
  getStudentProfile,
  getStudents,
} from "@/lib/dummy/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { SiswaBrowser, type SiswaRow } from "@/components/dashboard/siswa/siswa-browser";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Siswa",
  description:
    "Daftar siswa SLB dengan filter jenis hambatan, pencarian, dan ringkasan progres belajar.",
};

export default async function StudentsPage() {
  const [students, summary, sessions] = await Promise.all([
    getStudents(),
    getProgressSummary(),
    getSessions(),
  ]);

  const summaryById = new Map(summary.map((item) => [item.student.id, item]));
  const lastSessionById = new Map<string, string>();
  for (const session of sessions) {
    const current = lastSessionById.get(session.studentId);
    if (!current || session.startedAt > current) {
      lastSessionById.set(session.studentId, session.startedAt);
    }
  }

  const rows: SiswaRow[] = await Promise.all(
    students.map(async (student) => {
      const [classes, profile] = await Promise.all([
        getStudentClasses(student.id),
        getStudentProfile(student.id),
      ]);
      const stats = summaryById.get(student.id);
      return {
        student,
        classes: classes.map((c) => ({ id: c.id, name: c.name, grade: c.grade })),
        profile,
        publishedMaterials: stats?.published ?? 0,
        sessions: stats?.sessions ?? 0,
        minutes: stats?.minutes ?? 0,
        accuracy: stats?.accuracy ?? 0,
        lastSessionAt: lastSessionById.get(student.id) ?? null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Siswa"
        description="Semua siswa yang Andaampu, lengkap dengan kelas, materi terbit, dan ringkasan progres belajar mereka."
        actions={
          <Button asChild>
            <Link href="/dashboard/siswa/baru">
              <UserPlus />
              Tambah siswa
            </Link>
          </Button>
        }
      />

      <SiswaBrowser rows={rows} />
    </div>
  );
}