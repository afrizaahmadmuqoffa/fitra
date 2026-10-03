import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdaptationById,
  getMaterial,
  getRecords,
  getSessions,
  getStudent,
  getStudentClasses,
  getStudentProfile,
} from "@/lib/dummy/queries";
import { DISABILITY_LABELS, INTERACTION_LABELS, LEVEL_LABELS } from "@/lib/constants";
import {
  DisabilityBadge,
  EmptyState,
  ToneBadge,
  formatDurasi,
  formatTanggal,
  formatWaktu,
} from "@/components/dashboard/feedback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Clock, History, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Riwayat Belajar Siswa",
  description: "Timeline sesi belajar, durasi, respons, dan snapshot interaksi siswa.",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getStudent(studentId);
  if (!student) notFound();

  const [sessions, records, profile, classes] = await Promise.all([
    getSessions(studentId),
    getRecords(studentId),
    getStudentProfile(studentId),
    getStudentClasses(studentId),
  ]);

  const rows = await Promise.all(
    sessions.map(async (session) => {
      const adaptation = session.materialAdaptationId
        ? await getAdaptationById(session.materialAdaptationId)
        : null;
      const material = adaptation ? await getMaterial(adaptation.materialId) : null;
      const own = records.filter((record) => record.sessionId === session.id);
      const correct = own.filter((record) => record.isCorrect).length;
      return {
        session,
        materialTitle: material?.title ?? "Materi pilihan siswa",
        materialId: adaptation?.materialId ?? null,
        adaptationId: adaptation?.id ?? null,
        own,
        correct,
        seconds: own.reduce((a, record) => a + record.timeSpentSeconds, 0),
      };
    }),
  );

  const totalSeconds = sessions.reduce((a, session) => a + session.durationSeconds, 0);
  const correctAll = records.filter((record) => record.isCorrect).length;
  const accuracy = records.length ? Math.round((correctAll / records.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/progres">
          <ArrowLeft />
          Semua progres
        </Link>
      </Button>

      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0">
              <AvatarImage src={student.photoUrl} alt="" />
              <AvatarFallback>{initialsOf(student.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold">{student.fullName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {student.age} tahun - {classes.map((item) => item.name).join(", ") || "belum ada kelas"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DisabilityBadge label={DISABILITY_LABELS[student.disabilityType]} />
                {profile ? (
                  <ToneBadge
                    label={LEVEL_LABELS[profile.academicLevel]}
                    tone={profile.academicLevel === "low" ? "warning" : "info"}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Sesi</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">
                {sessions.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Waktu</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">
                {Math.round(totalSeconds / 60)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Interaksi</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">
                {records.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ketepatan</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">{accuracy}%</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum ada riwayat belajar"
          description="Riwayat sesi akan terisi otomatis setelah siswa memindai QR dan membuka materi yang Anda terbitkan."
          action={
            <Button asChild>
              <Link href={`/dashboard/kelas/${classes[0]?.id ?? ""}/qr`}>Kelola QR siswa</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Timeline sesi</h2>
          <ol className="space-y-3">
            {rows.map(({ session, materialTitle, materialId, adaptationId, own, correct, seconds }) => (
              <li key={session.id}>
                <Card className="border-border/80">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-heading text-base font-semibold">
                          <BookOpen className="size-4 text-primary" aria-hidden="true" />
                          {materialTitle}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatTanggal(session.startedAt)}</span>
                          <span aria-hidden="true">-</span>
                          <span>
                            {formatWaktu(session.startedAt)} -{" "}
                            {formatWaktu(session.completedAt ?? session.startedAt)}
                          </span>
                          <span aria-hidden="true">-</span>
                          <span>{formatDurasi(session.durationSeconds)}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ToneBadge
                          label={session.completedAt ? "Selesai" : "Belum selesai"}
                          tone={session.completedAt ? "success" : "warning"}
                        />
                        {adaptationId && materialId ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/materi/${materialId}/adaptasi/${student.id}`}>
                              Lihat materi
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Jawaban benar</p>
                        <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
                          {correct} dari {own.length}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Waktu menjawab</p>
                        <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
                          {Math.round(seconds / 60)} menit
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Rata-rata per soal</p>
                        <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
                          {own.length ? Math.round(seconds / own.length) : 0} detik
                        </p>
                      </div>
                    </div>

                    {own.length ? (
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <Target className="size-4 text-primary" aria-hidden="true" />
                          Snapshot respons
                        </p>
                        <ul className="space-y-1.5">
                          {own.map((record) => (
                            <li
                              key={record.id}
                              className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                            >
                              <Badge variant="outline" className="shrink-0">
                                Bagian {record.sectionIndex + 1}
                              </Badge>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {INTERACTION_LABELS[record.interactionType]}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{record.response}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {record.timeSpentSeconds} detik
                              </span>
                              <ToneBadge
                                label={record.isCorrect ? "Benar" : "Belum tepat"}
                                tone={record.isCorrect ? "success" : "warning"}
                              />
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-2" />
                        <Progress
                          value={own.length ? Math.round((correct / own.length) * 100) : 0}
                          indicatorClassName="bg-primary"
                          aria-label="Ketepatan sesi ini"
                        />
                      </div>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" aria-hidden="true" />
                        Belum ada jawaban tercatat pada sesi ini.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}