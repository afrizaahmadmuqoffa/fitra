import type { Metadata } from "next";
import Link from "next/link";
import {
  getClasses,
  getMaterialAdaptations,
  getMaterials,
} from "@/db/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { MateriBrowser, type MateriRow } from "@/components/dashboard/materi/materi-browser";
import { BookOpen, Upload } from "lucide-react";

export const metadata: Metadata = {
  title: "Daftar Materi",
  description:
    "Semua materi yang diunggah beserta status proses AI dan kurasi adaptasi per siswa.",
};

export default async function MaterialsPage() {
  const [materials, classes] = await Promise.all([getMaterials(), getClasses()]);
  const classById = new Map(classes.map((item) => [item.id, item.name]));
  const adaptations = await Promise.all(
    materials.map((material) => getMaterialAdaptations(material.id)),
  );

  const rows: MateriRow[] = materials.map((material, index) => {
    const list = adaptations[index];
    return {
      id: material.id,
      title: material.title,
      subject: material.subject,
      className: material.classId ? (classById.get(material.classId) ?? "") : "",
      sourceType: material.sourceType,
      sourceFileName: material.sourceFileName,
      status: material.status,
      createdAt: material.createdAt,
      sections: material.aiAnalysis?.structure.length ?? 0,
      adaptations: list.length,
      approved: list.filter((item) => item.status === "approved").length,
      readingLevel: material.aiAnalysis?.estimatedReadingLevel ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materi"
        description="Unggah materi sekali, lalu AI membuat versi adaptasi untuk setiap siswa sesuai profil belajarnya."
        actions={
          <Button asChild>
            <Link href="/dashboard/materi/baru">
              <Upload />
              Unggah materi
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada materi"
          description="Unggah materi pertama untuk mulai membuat adaptasi otomatis."
        />
      ) : (
        <MateriBrowser rows={rows} />
      )}
    </div>
  );
}