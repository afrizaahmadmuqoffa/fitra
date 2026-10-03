import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPpiDocument,
  getStudent,
  getTeacher,
} from "@/db/queries";
import { DISABILITY_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard/page-header";
import { DisabilityBadge, formatTanggal } from "@/components/dashboard/feedback";
import { Button } from "@/components/ui/button";
import { PpiEditor } from "@/components/dashboard/ppi/ppi-editor";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Editor PPI",
  description:
    "Sunting Program Individu Plansional dan lihat pratinjau cetak resmi sekolah.",
};

export default async function PpiEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ppi = await getPpiDocument(id);
  if (!ppi) notFound();

  const [student, teacher] = await Promise.all([getStudent(ppi.studentId), getTeacher()]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/ppi">
          <ArrowLeft />
          Semua dokumen PPI
        </Link>
      </Button>

      <PageHeader
        title={`PPI ${student?.fullName ?? "Siswa"}`}
        description={`Tahun ajaran ${ppi.academicYear} - dibuat ${formatTanggal(ppi.createdAt)} - terakhir diperbarui ${formatTanggal(ppi.updatedAt)}.`}
        actions={
          student ? (
            <DisabilityBadge label={DISABILITY_LABELS[student.disabilityType]} />
          ) : null
        }
      />

      <PpiEditor document={ppi} student={student} teacher={teacher} />
    </div>
  );
}