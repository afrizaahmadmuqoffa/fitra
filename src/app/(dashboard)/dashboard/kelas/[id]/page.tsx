import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClass,
  getClassMaterials,
  getClassStudents,
  getTokens,
} from "@/lib/dummy/queries";
import { MATERIAL_STATUS } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard/page-header";
import { ToneBadge, formatTanggal } from "@/components/dashboard/feedback";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  QrCode,
  Upload,
  Users,
} from "lucide-react";
import { DISABILITY_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Detail Kelas",
  description: "Daftar siswa, materi, dan akses QR dalam satu kelas.",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getClass(id);
  if (!item) notFound();

  const [students, materials, tokens] = await Promise.all([
    getClassStudents(id),
    getClassMaterials(id),
    getTokens(id),
  ]);

  const tokenByStudent = new Map(tokens.map((token) => [token.studentId, token]));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/kelas">
          <ArrowLeft />
          Semua kelas
        </Link>
      </Button>

      <PageHeader
        title={item.name}
        description={`${item.subject} - Ruang ${item.room}. Kelas ini dibuat ${formatTanggal(item.createdAt)}.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/kelas/${item.id}/qr`}>
                <QrCode />
                Kelola QR
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/materi/baru">
                <Upload />
                Unggah materi
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />
            Siswa di kelas
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {students.length}
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="size-4" aria-hidden="true" />
            Materi tersedia
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {materials.length}
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <QrCode className="size-4" aria-hidden="true" />
            Token aktif
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {tokens.filter((token) => token.isActive).length}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              dari {tokens.length}
            </span>
          </p>
        </Card>
      </div>

      <Card className="border-border/80 bg-muted/40">
        <CardContent className="flex items-start gap-3 pt-6">
          <GraduationCap className="mt-0.5 size-5 text-primary" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="siswa">
        <TabsList>
          <TabsTrigger value="siswa">Siswa</TabsTrigger>
          <TabsTrigger value="materi">Materi</TabsTrigger>
        </TabsList>

        <TabsContent value="siswa" className="space-y-3">
          <ul className="grid gap-3 md:grid-cols-2">
            {students.map((student) => {
              const token = tokenByStudent.get(student.id);
              return (
                <li key={student.id}>
                  <Card className="border-border/80 transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-3 pt-6">
                      <Avatar className="size-11 shrink-0">
                        <AvatarImage src={student.photoUrl} alt="" />
                        <AvatarFallback>{initialsOf(student.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-sm font-semibold">
                          {student.fullName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {DISABILITY_LABELS[student.disabilityType]} - {student.age} tahun
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <ToneBadge
                            label={token?.isActive ? "QR aktif" : "QR nonaktif"}
                            tone={token?.isActive ? "success" : "destructive"}
                          />
                          {token?.lastUsedAt ? (
                            <span className="text-xs text-muted-foreground">
                              Terakhir dipakai {formatTanggal(token.lastUsedAt)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Belum pernah dipakai
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link
                          href={`/dashboard/siswa/${student.id}`}
                          aria-label={`Lihat detail ${student.fullName}`}
                        >
                          <ArrowRight />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="materi" className="space-y-3">
          {materials.length === 0 ? (
            <Card className="border-dashed px-6 py-10 text-center">
              <p className="font-heading text-base font-semibold">
                Belum ada materi di kelas ini
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Unggah PDF, DOCX, atau paste teks materi agar AI bisa membuat versi
                adaptasi untuk setiap siswa.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/materi/baru">
                  <Upload />
                  Unggah materi
                </Link>
              </Button>
            </Card>
          ) : (
            <ul className="space-y-3">
              {materials.map((material) => {
                const status = MATERIAL_STATUS[material.status];
                return (
                  <li key={material.id}>
                    <Card className="border-border/80 transition-colors hover:border-primary/40">
                      <CardContent className="flex flex-wrap items-center gap-3 pt-6">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-sm font-semibold">
                            {material.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {material.subject} - {material.sourceFileName} -{" "}
                            {material.aiAnalysis
                              ? `${material.aiAnalysis.structure.length} bagian teridentifikasi`
                              : "Belum dianalisis AI"}
                          </p>
                          <Progress
                            value={
                              material.status === "published"
                                ? 100
                                : material.status === "ai_ready"
                                  ? 75
                                  : material.status === "pending_ai"
                                    ? 40
                                    : 15
                            }
                            className="mt-2 max-w-xs"
                            aria-label={`Progres proses materi ${material.title}`}
                          />
                        </div>
                        <ToneBadge label={status.label} tone={status.tone} />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/materi/${material.id}`}>Buka</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}