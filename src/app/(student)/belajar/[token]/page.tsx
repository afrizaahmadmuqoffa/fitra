import type { Metadata } from "next";
import {
  getActiveMaterialsForStudent,
  getStudentClasses,
  getStudentContextForStudent,
  resolveStudentAccess,
} from "@/db/queries/student";
import { isTokenExpired } from "@/lib/tokens";
import { StudentAdaptiveShell } from "@/components/student/student-adaptive-shell";
import { StudentWelcome } from "@/components/student/student-welcome";
import { TokenNotice } from "@/components/student/token-notice";

export const metadata: Metadata = {
  title: "Masuk Sesi Belajar",
  description: "Pintu masuk sesi belajar siswa melalui token QR kelas.",
  robots: { index: false, follow: false },
};

export default async function StudentEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await resolveStudentAccess(token);

  if (!access) {
    return <TokenNotice status="tidak-ditemukan" />;
  }

  const { student, profile } = await getStudentContextForStudent(access.studentId);

  if (!access.isActive) {
    return <TokenNotice status="nonaktif" studentName={student?.fullName} />;
  }

  if (isTokenExpired(access.expiresAt)) {
    return (
      <TokenNotice
        status="kedaluwarsa"
        expiresAt={access.expiresAt}
        studentName={student?.fullName}
      />
    );
  }

  if (!student) return <TokenNotice status="tidak-ditemuka" />;

  const [classes, active] = await Promise.all([
    getStudentClasses(student.id),
    getActiveMaterialsForStudent(student.id),
  ]);

  return (
    <StudentAdaptiveShell student={student} profile={profile} token={token}>
      <StudentWelcome
        student={student}
        nickname={student.nickname}
        classNames={classes.map((item) => item.name)}
        subjectCount={classes.length}
        publishedCount={active.length}
        sessionHref={`/belajar/${token}/sesi`}
      />
    </StudentAdaptiveShell>
  );
}