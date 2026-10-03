import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAdaptation,
  getMaterial,
  getStudent,
  getStudentProfile,
  getVisualAssets,
} from "@/db/queries";
import { AdaptationEditor } from "@/components/dashboard/materi/adaptation-editor";

export const metadata: Metadata = {
  title: "Editor Adaptasi",
  description:
    "Bandingkan materi asli dengan hasil adaptasi AI, sunting, setujui, dan atur ilustrasi per siswa.",
};

export default async function AdaptationPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;
  const [material, adaptation, student, profile] = await Promise.all([
    getMaterial(id),
    getAdaptation(id, studentId),
    getStudent(studentId),
    getStudentProfile(studentId),
  ]);

  if (!material || !adaptation || !student) notFound();

  const assets = await getVisualAssets(adaptation.id);

  return (
    <AdaptationEditor
      material={material}
      adaptation={adaptation}
      student={student}
      profile={profile}
      initialAssets={assets}
    />
  );
}