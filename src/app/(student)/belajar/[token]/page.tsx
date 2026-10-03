import type { Metadata } from "next";
import {
  getActiveMaterialsForStudent,
  getStudent,
  getStudentClasses,
  getTokenByValue,
  getTokens,
  isTokenExpired,
} from "@/lib/dummy/queries";
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
  const access = await getTokenByValue(token);

  if (!access) {
    const samples = await getTokens("cls-iv-b");
    return (
      <TokenNotice
        status="tidak-ditemukan"
        samples={samples.filter((item) => item.isActive).map((item) => item.token)}
      />
    );
  }

  const student = await getStudent(access.studentId);

  if (!access.isActive) {
    return <TokenNotice status="nonaktif" studentName={student?.fullName} />;
  }

  if (await isTokenExpired(access.expiresAt)) {
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
    <StudentWelcome
      student={student}
      nickname={student.nickname}
      classNames={classes.map((item) => item.name)}
      subjectCount={classes.length}
      publishedCount={active.length}
      sessionHref={`/belajar/${token}/sesi`}
    />
  );
}