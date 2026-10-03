import type { Metadata } from "next";
import Link from "next/link";
import {
  getClassesWithMeta,
  getMaterials,
  getRecentSessions,
  getStudents,
  getTeacher,
  getTeacherChecklist,
} from "@/db/queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ToneBadge, formatDurasi, formatWaktu } from "@/components/dashboard/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dasbor",
  description:
    "Ringkasan siswa, kelas, materi terbit, dan aktivitas belajar hari ini di Fitra.",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function DashboardPage() {
  const [teacher, students, classes, materials, recent, checklist] =
    await Promise.all([
      getTeacher(),
      getStudents(),
      getClassesWithMeta(),
      getMaterials(),
      getRecentSessions(5),
      getTeacherChecklist(),
    ]);

  const published = materials.filter((m) => m.status === "published");
  const pendingReview = checklist.find((c) => c.id === "review")?.count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, Bu ${teacher.nickname.split(" ")[0]}`}
        description="Ringkasan kelas Anda hari ini: siapa yang belajar, materi apa yang sudah terbit, dan apa yang masih perlu Anda periksa."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/siswa/baru">Tambah siswa</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/materi/baru">Unggah materi</Link>
            </Button>
          </>
        }
      />

      <section aria-labelledby="ringkasan-statistik" className="space-y-3">
        <h2 id="ringkasan-statistik" className="sr-only">
          Ringkasan statistik
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Siswa"
            value={students.length}
            hint={`${classes.length} kelas aktif dengan materi adaptif`}
            icon={Users}
            href="/dashboard/siswa"
          />
          <StatCard
            label="Kelas Aktif"
            value={classes.length}
            hint={`${classes.reduce((a, c) => a + c.studentCount, 0)} kemunculan siswa di kelas`}
            icon={GraduationCap}
            href="/dashboard/kelas"
          />
          <StatCard
            label="Materi Terbit"
            value={published.length}
            hint={`${materials.length} materi total, ${materials.length - published.length} masih disusun`}
            icon={BookOpen}
            href="/dashboard/materi"
          />
          <StatCard
            label="Menunggu Review"
            value={pendingReview}
            hint="Adaptasi AI yang belum Anda setujui"
            icon={Sparkles}
            href="/dashboard/materi"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Belajar Terbaru</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Sesi siswa yang baru saja berjalan di kelas Anda.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/dashboard/progres">
                Lihat progres
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recent.map(({ session, student, material }) => (
                <li key={session.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={student.photoUrl} alt="" />
                    <AvatarFallback>{initialsOf(student.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {student.fullName}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        menyelesaikan{" "}
                        {material ? (
                          <span className="text-foreground">{material.title}</span>
                        ) : (
                          "materi pilihan"
                        )}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatWaktu(session.startedAt)} - {formatWaktu(session.completedAt ?? session.startedAt)} -{" "}
                      {formatDurasi(session.durationSeconds)}
                      {session.completedAt ? "" : " - belum diselesaikan"}
                    </p>
                  </div>
                  <ToneBadge
                    label={session.completedAt ? "Selesai" : "Berlangsung"}
                    tone={session.completedAt ? "success" : "warning"}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Perlu Perhatian Anda</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Daftar tindakan singkat agar semua siswa tetap bisa belajar.
            </p>
          </CardHeader>
          <CardContent>
            {checklist.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg bg-success/8 px-4 py-8 text-center">
                <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
                <p className="text-sm font-medium">
                  Semua beres. Tidak ada yang perlu Anda periksa sekarang.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {checklist.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group block rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        <ToneBadge label={String(item.count)} tone={item.tone} />
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Separator className="my-4" />

            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-sm font-medium">Butuh bantuan?</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Panduan singkat cara memetakan profil, mengunggah materi, dan
                menerbitkan adaptasi ada di halaman Panduan.
              </p>
              <Button variant="link" size="sm" asChild className="mt-1 h-auto px-0">
                <Link href="/panduan">Buka panduan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}