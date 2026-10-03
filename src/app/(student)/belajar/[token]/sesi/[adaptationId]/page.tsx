import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAdaptationById,
  getMaterial,
  getStudent,
  getStudentProfile,
  getTokenByValue,
  getVisualAssets,
} from "@/lib/dummy/queries";
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
  const access = await getTokenByValue(token);
  if (!access) return <TokenNotice status="tidak-ditemukan" />;

  const adaptation = await getAdaptationById(adaptationId);
  if (!adaptation || adaptation.studentId !== access.studentId) notFound();

  if (!access.isActive) {
    const student = await getStudent(access.studentId);
    return <TokenNotice status="nonaktif" studentName={student?.fullName} />;
  }

  const [material, student, profile] = await Promise.all([
    getMaterial(adaptation.materialId),
    getStudent(access.studentId),
    getStudentProfile(access.studentId),
  ]);
  if (!material || !student) notFound();

  if (adaptation.status !== "approved" || material.status !== "published") {
    return (
      <StudentLoadingPlaceholder
        title="Materi ini belum dibuka"
        body="Guru masih menyunting materi ini. Materi akan muncul setelah guru menyetujuinya."
        listHref={`/belajar/${token}/sesi`}
      />
    );
  }

  const assets = await getVisualAssets(adaptation.id);

  return (
    <AdaptivePlayer
      studentName={student.nickname}
      materialTitle={material.title}
      subject={material.subject}
      sections={adaptation.adaptedContent.sections}
      assets={assets}
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
  );
}