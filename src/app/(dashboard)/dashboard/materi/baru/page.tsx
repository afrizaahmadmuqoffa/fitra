import type { Metadata } from "next";
import Link from "next/link";
import { getClasses, getClassStudents } from "@/db/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { MateriUploadForm } from "@/components/dashboard/materi/materi-upload-form";
import { ArrowLeft } from "lucide-react";
import type { Student } from "@/lib/dummy/types";

export const metadata: Metadata = {
  title: "Unggah Materi",
  description:
    "Unggah PDF atau DOCX, atau tempelkan teks materi, lalu pilih kelas dan siswa target adaptasi.",
};

export default async function NewMaterialPage() {
  const classes = await getClasses();
  const entries = await Promise.all(
    classes.map(async (item) => [item.id, await getClassStudents(item.id)] as const),
  );
  const studentsByClass = Object.fromEntries(entries) as Record<string, Student[]>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/materi">
          <ArrowLeft />
          Kembali ke daftar materi
        </Link>
      </Button>

      <PageHeader
        title="Unggah Materi"
        description="Unggah bahan ajar yang sudah Anda pakai di kelas. Sistem membacanya, memisahkan bagiannya, lalu menyiapkan versi adaptasi untuk setiap siswa target."
      />

      <MateriUploadForm classes={classes} studentsByClass={studentsByClass} />
    </div>
  );
}