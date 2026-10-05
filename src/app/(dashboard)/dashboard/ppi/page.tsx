import type { Metadata } from "next";
import Link from "next/link";
import {
  getPpiDocuments,
  getStudent,
} from "@/db/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ToneBadge, formatTanggal } from "@/components/dashboard/feedback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilePlus2, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Dokumen PPI",
  description:
    "Daftar Program Individu Plansional yearly untuk setiap siswa beserta status draft atau final.",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function PpiListPage() {
  const documents = await getPpiDocuments();
  const rows = await Promise.all(
    documents.map(async (doc) => ({ doc, student: await getStudent(doc.studentId) })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen PPI"
        description="Susun Program Individu Plansional dari profil dan progres siswa. Dokumen draft bisa diperbaiki berkali-kali sebelum difinalkan."
        actions={
          <Button asChild>
            <Link href="/dashboard/ppi/baru">
              <FilePlus2 />
              Buat PPI
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada dokumen PPI"
          description="Susun Program Individu Plansional dari profil dan progres siswa. Isian tujuan pembelajaran, layanan, dan evaluasi terisi otomatis dari data yang sudah ada."
        />
      ) : (
        <Card className="border-border/80">
          <ScrollArea className="w-full">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Tahun ajaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ doc, student }) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {student ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={student.photoUrl} alt="" />
                            <AvatarFallback>{initialsOf(student.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/siswa/${student.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {student.fullName}
                            </Link>
                            <span className="block text-xs text-muted-foreground">
                              {student.nickname}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Siswa dihapus</span>
                      )}
                    </TableCell>
                    <TableCell>{doc.academicYear}</TableCell>
                    <TableCell>
                      <ToneBadge
                        label={doc.status === "final" ? "Final" : "Draft"}
                        tone={doc.status === "final" ? "success" : "warning"}
                      />
                    </TableCell>
                    <TableCell className="text-sm">{formatTanggal(doc.createdAt)}</TableCell>
                    <TableCell className="text-sm">{formatTanggal(doc.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/ppi/${doc.id}`}>Buka</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}