import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getClasses } from "@/lib/dummy/queries";
import { SiswaForm } from "@/components/dashboard/siswa/siswa-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Tambah Siswa",
  description:
    "Tambahkan siswa baru beserta identitas, kelas, dan pemetaan awal profil belajarnya.",
};

export default async function NewStudentPage() {
  const classes = await getClasses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Siswa"
        description="Isi identitas dasar siswa, tempatkan di kelas, lalu buat pemetaan awal agar materi bisa diadaptasi dengan tepat."
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/siswa">
              <ArrowLeft />
              Kembali ke daftar
            </Link>
          </Button>
        }
      />

      <SiswaForm classes={classes} />
    </div>
  );
}