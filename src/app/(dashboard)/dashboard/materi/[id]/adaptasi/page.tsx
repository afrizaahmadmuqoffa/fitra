import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import {
  getMaterial,
  getMaterialAdaptations,
  getStudents,
} from "@/db/queries/teacher";
import { ADAPTATION_STATUS } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ToneBadge, formatTanggal } from "@/components/dashboard/feedback";

export const metadata: Metadata = {
  title: "Daftar Adaptasi",
  description: "Semua versi adaptasi materi untuk setiap siswa beserta status kurasi.",
};

export default async function MaterialAdaptationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [material, adaptations, semuaSiswa] = await Promise.all([
    getMaterial(id),
    getMaterialAdaptations(id),
    getStudents(),
  ]);

  if (!material) notFound();

  const namaSiswa = new Map(semuaSiswa.map((item) => [item.id, item.fullName]));

  // Versi terbaru per siswa ditampilkan lebih dulu, lalu versi lama sebagai
  // riwayat. PRD 6.D: riwayat tidak boleh dihapus.
  const perSiswa = new Map<string, typeof adaptations>();
  for (const adaptasi of adaptations) {
    const list = perSiswa.get(adaptasi.studentId) ?? [];
    list.push(adaptasi);
    perSiswa.set(adaptasi.studentId, list);
  }
  const baris = [...perSiswa.entries()]
    .map(([studentId, list]) => ({
      studentId,
      versi: [...list].sort((a, b) => b.version - a.version),
    }))
    .sort((a, b) => a.studentId.localeCompare(b.studentId));

  const totalVersi = adaptations.length;
  const disetujui = adaptations.filter((item) => item.status === "approved").length;
  const menunggu = adaptations.filter(
    (item) => item.status === "draft" || item.status === "edited",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Adaptasi"
        description={`Semua versi adaptasi untuk "${material.title}". Setiap regenerasi menambah versi baru dan versi lama tetap tersimpan.`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/dashboard/materi/${material.id}`}>
              <ArrowLeft aria-hidden="true" />
              Kembali ke detail materi
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Total versi</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalVersi}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Sudah disetujui</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{disetujui}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Menunggu review</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{menunggu}</p>
          </CardContent>
        </Card>
      </div>

      {baris.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada adaptasi"
          description="Belum ada versi adaptasi untuk materi ini. Buka halaman detail materi lalu tekan tombol Buat adaptasi pada salah satu siswa."
        />
      ) : (
        <Card className="border-border/80">
          <ScrollArea className="w-full">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Versi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bagian</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baris.map(({ studentId, versi }) =>
                  versi.map((item, posisi) => {
                    const meta = ADAPTATION_STATUS[item.status];
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {posisi === 0 ? (
                            <Link
                              href={`/dashboard/siswa/${studentId}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {namaSiswa.get(studentId) ?? "Siswa tidak ditemukan"}
                            </Link>
                          ) : (
                            <span className="pl-3 text-muted-foreground">
                              versi sebelumnya
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={posisi === 0 ? "default" : "outline"}
                            className="tabular-nums"
                          >
                            v{item.version}
                            {posisi === 0 ? " terbaru" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ToneBadge
                            label={meta?.label ?? item.status}
                            tone={meta?.tone ?? "muted"}
                          />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {item.adaptedContent.sections.length}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTanggal(item.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/dashboard/materi/${material.id}/adaptasi/${studentId}`}
                            >
                              {posisi === 0 ? "Buka" : "Lihat"}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }),
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
