import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getApprovedAdaptation,
  getStudentContextForStudent,
  resolveStudentAccess,
} from "@/db/queries/student";
import { StudentAdaptiveShell } from "@/components/student/student-adaptive-shell";
import { AdaptivePlayer } from "@/components/student/adaptive-player";
import { TokenNotice } from "@/components/student/token-notice";
import { StudentLoadingPlaceholder } from "@/components/student/student-loading";

export const metadata: Metadata = {
  title: "Belajar Materi",
  description: "Pemutar materi adaptif dengan sorotan teks dan input pilihan besar.",
  robots: { index: false, follow: false },
};

export default async function StudentPlayerPage({
  params,
}: {
  params: Promise<{ token: string; adaptationId: string }>;
}) {
  const { token, adaptationId } = await params;
  const access = await resolveStudentAccess(token);
  if (!access) return <TokenNotice status="tidak-ditemukan" />;

  const bundle = await getApprovedAdaptation(adaptationId);
  if (!bundle || bundle.studentId !== access.studentId) notFound();

  const { student, profile } = await getStudentContextForStudent(bundle.studentId);
  if (!student) return <TokenNotice status="tidak-ditemuka" />;

  if (!access.isActive) {
    return <TokenNotice status="nonaktif" studentName={student.fullName} />;
  }

  if (bundle.state === "locked") {
    return (
      <StudentLoadingPlaceholder
        title="Materi ini belum dibuka"
        body="Guru masih menyunting materi ini. Materi akan muncul setelah guru menyetujuinya lalu menerbitkannya."
        listHref={`/belajar/${token}/sesi`}
      />
    );
  }

  return (
    <StudentAdaptiveShell student={student} profile={profile} token={token}>
      <AdaptivePlayer
        studentName={student.nickname}
        materialTitle={bundle.material.title}
        subject={bundle.material.subject}
        sections={bundle.adaptation.adaptedContent.sections}
        assets={bundle.assets}
        uiTokens={
          profile?.uiTokens ?? {
            fontSize: "medium",
            contrastMode: "normal",
            audioEnabled: true,
            audioSpeed: "normal",
            navStyle: "step",
          }
        }
        modes={
          profile?.interactionModes ?? {
            touch: true,
            speech: false,
            keyboard: false,
            switch: false,
            drag: false,
          }
        }
        listHref={`/belajar/${token}/sesi`}
        doneHref={`/belajar/${token}/selesai`}
      />
    </StudentAdaptiveShell>
  );
}