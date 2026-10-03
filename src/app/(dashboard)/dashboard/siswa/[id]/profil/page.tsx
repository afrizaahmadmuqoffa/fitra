import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent, getStudentProfile } from "@/db/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { ProfilForm } from "@/components/dashboard/siswa/profil-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Profil Belajar Siswa",
  description:
    "Pemetaan kemampuan akademik, sosial-emosional, motorik, kemandirian, serta preferensi dan bentuk interaksi siswa.",
};

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();
  const profile = await getStudentProfile(id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/dashboard/siswa/${student.id}`}>
          <ArrowLeft />
          Kembali ke detail siswa
        </Link>
      </Button>

      <PageHeader
        title={`Profil Belajar ${student.fullName}`}
        description="Profil ini menjadi bahan utama adaptasi materi dan pengaturan tampilan layar siswa. Perbarui bila ada perubahan kemampuan."
      />

      <ProfilForm studentId={student.id} profile={profile} />
    </div>
  );
}