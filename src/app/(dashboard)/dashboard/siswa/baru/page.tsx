import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { StudentWizard } from "@/components/dashboard/siswa/student-wizard";
import { getClasses } from "@/db/queries";

export const metadata: Metadata = {
  title: "Tambah Siswa",
  description:
    "Tambahkan siswa baru beserta identitas, kelas, dan pemetaan profil belajarnya.",
};

export default async function NewStudentPage() {
  const classes = await getClasses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Siswa"
        description="Enam langkah: identitas, kelas, kemampuan akademik, sosial dan motorik, kemandirian, lalu preferensi dan interaksi. Langkah mapper boleh dilewati karena sudah terisi bawaan."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/siswa">
              <ArrowLeft />
              Kembali ke daftar
            </Link>
          </Button>
        }
      />

      <StudentWizard mode="buat" classes={classes} />
    </div>
  );
}