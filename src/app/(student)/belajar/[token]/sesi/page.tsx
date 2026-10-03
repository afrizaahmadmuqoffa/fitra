import type { Metadata } from "next";
import {
  getActiveMaterialsForStudent,
  getRecordsForStudent,
  getSessionsForStudent,
  getStudentClasses,
  getStudentContextForStudent,
  resolveStudentAccess,
} from "@/db/queries/student";
import { StudentAdaptiveShell } from "@/components/student/student-adaptive-shell";
import { StudentSessionList } from "@/components/student/student-session-list";
import { TokenNotice } from "@/components/student/token-notice";

export const metadata: Metadata = {
  title: "Materi Belajar",
  description: "Daftar materi yang sudah diterbitkan guru untuk siswa.",
  robots: { index: false, follow: false },
};

export default async function StudentSessionListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await resolveStudentAccess(token);
  if (!access) return <TokenNotice status="tidak-ditemukan" />;

  const { student, profile } = await getStudentContextForStudent(access.studentId);
  if (!student) return <TokenNotice status="tidak-ditemuka" />;

  if (!access.isActive) {
    return <TokenNotice status="nonaktif" studentName={student.fullName} />;
  }

  const [active, classes, sessions, records] = await Promise.all([
    getActiveMaterialsForStudent(student.id),
    getStudentClasses(student.id),
    getSessionsForStudent(student.id),
    getRecordsForStudent(student.id),
  ]);

  const attempted = new Set(
    sessions.map((item) => item.materialAdaptationId ?? "").filter(Boolean),
  );

  return (
    <StudentAdaptiveShell student={student} profile={profile} token={token}>
      <StudentSessionList
        student={student}
        classNames={classes.map((item) => item.name)}
        items={active}
        attempted={Array.from(attempted)}
        records={records.map((record) => ({
          sessionId: record.sessionId,
          isCorrect: record.isCorrect,
        }))}
        backHref={`/belajar/${token}`}
        doneHref={`/belajar/${token}/selesai`}
      />
    </StudentAdaptiveShell>
  );
}