import type { Metadata } from "next";
import {
  getRecords,
  getSessions,
  getStudent,
  getTokenByValue,
} from "@/lib/dummy/queries";
import { StudentDone } from "@/components/student/student-done";
import { TokenNotice } from "@/components/student/token-notice";

export const metadata: Metadata = {
  title: "Sesi Selesai",
  description: "Layar apresiasi dan ringkasan hasil belajar siswa.",
  robots: { index: false, follow: false },
};

export default async function StudentDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ benar?: string; dijawab?: string; total?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  const access = await getTokenByValue(token);
  if (!access) return <TokenNotice status="tidak-ditemukan" />;

  const student = await getStudent(access.studentId);
  if (!student) return <TokenNotice status="tidak-ditemuka" />;

  const [sessions, records] = await Promise.all([
    getSessions(student.id),
    getRecords(student.id),
  ]);

  const totalSeconds = sessions.reduce((a, item) => a + item.durationSeconds, 0);
  const correct = records.filter((item) => item.isCorrect).length;

  return (
    <StudentDone
      studentName={student.nickname}
      photoUrl={student.photoUrl}
      sessionCorrect={Number(query.benar ?? correct)}
      sessionAnswered={Number(query.dijawab ?? records.length)}
      sessionTotal={Number(query.total ?? records.length)}
      allCorrect={correct}
      allRecords={records.length}
      minutes={Math.round(totalSeconds / 60)}
      listHref={`/belajar/${token}/sesi`}
      homeHref={`/belajar/${token}`}
    />
  );
}