import type { Metadata } from "next";
import {
  getActiveMaterialsForStudent,
  getRecords,
  getSessions,
  getStudent,
  getStudentClasses,
  getTokenByValue,
} from "@/lib/dummy/queries";
import { StudentSessionList } from "@/components/student/student-session-list";
import { TokenNotice } from "@/components/student/token-notice";

export const metadata: Metadata = {
  title: "Materi Belajar",
  description: "Daftar materi yang sudahditerbitkan guru untuk siswa.",
  robots: { index: false, follow: false },
};

export default async function StudentSessionListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await getTokenByValue(token);
  if (!access) return <TokenNotice status="tidak-ditemukan" />;
  if (!access.isActive) {
    const student = await getStudent(access.studentId);
    return <TokenNotice status="nonaktif" studentName={student?.fullName} />;
  }

  const student = await getStudent(access.studentId);
  if (!student) return <TokenNotice status="tidak-ditemuka" />;

  const [active, classes, sessions, records] = await Promise.all([
    getActiveMaterialsForStudent(student.id),
    getStudentClasses(student.id),
    getSessions(student.id),
    getRecords(student.id),
  ]);

  const attempted = new Set(sessions.map((item) => item.materialAdaptationId));

  return (
    <StudentSessionList
      student={student}
      classNames={classes.map((item) => item.name)}
      items={active}
      attempted={Array.from(attempted).filter((id): id is string => Boolean(id))}
      records={records.map((record) => ({
        sessionId: record.sessionId,
        isCorrect: record.isCorrect,
      }))}
      backHref={`/belajar/${token}`}
      doneHref={`/belajar/${token}/selesai`}
    />
  );
}