import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { StudentWizard } from "@/components/dashboard/siswa/student-wizard";
import {
  getClasses,
  getStudent,
  getStudentClasses,
  getStudentProfile,
} from "@/db/queries";

export const metadata: Metadata = {
  title: "Ubah Data Siswa",
  description:
    "Satu wizard untuk memperbarui identitas, kelas, dan profil belajar siswa.",
};

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const [classes, profile, studentClasses] = await Promise.all([
    getClasses(),
    getStudentProfile(id),
    getStudentClasses(id),
  ]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/dashboard/siswa/${student.id}`}>
          <ArrowLeft />
          Kembali ke detail siswa
        </Link>
      </Button>

      <PageHeader
        title={`Ubah Data ${student.fullName}`}
        description="Wizard yang sama seperti saat menambah siswa, jadi tidak ada isian yang berbeda di dua tempat. Perubahan tersimpan sekaligus untuk identitas, kelas, dan profil belajar."
      />

      <StudentWizard
        mode="ubah"
        classes={classes}
        student={student}
        profile={profile}
        initialClassIds={studentClasses.map((item) => item.id)}
      />
    </div>
  );
}