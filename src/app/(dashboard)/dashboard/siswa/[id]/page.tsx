import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdaptationById,
  getMaterial,
  getRecords,
  getSessions,
  getStudent,
  getStudentAdaptations,
  getStudentClasses,
  getStudentPpi,
  getStudentProfile,
  getTokensByStudent,
} from "@/db/queries";
import { ADAPTATION_STATUS, DISABILITY_LABELS, LEVEL_LABELS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DisabilityBadge,
  EmptyState,
  ToneBadge,
  formatDurasi,
  formatTanggal,
  formatTanggalPendek,
  formatWaktu,
} from "@/components/dashboard/feedback";
import { InteractionModeList, PreferenceChips, SkillBarList } from "@/components/dashboard/siswa/profile-summary";
import { StudentActions } from "@/components/dashboard/siswa/student-actions";
import {
  ArrowLeft,
  BookOpen,
  ChartNoAxesColumn,
  CircleAlert,
  Clock,
  FileText,
  GraduationCap,
  PencilLine,
  QrCode,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Detail Siswa",
  description:
    "Ringkasan profil belajar, kelas yang diikuti, materi terbit, dan riwayat progres siswa.",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const [profile, classes, adaptations, sessions, records, tokens, ppi] =
    await Promise.all([
      getStudentProfile(id),
      getStudentClasses(id),
      getStudentAdaptations(id),
      getSessions(id),
      getRecords(id),
      getTokensByStudent(id),
      getStudentPpi(id),
    ]);

  const materialTitles = await Promise.all(
    adaptations.map(async (adaptation) => ({
      adaptation,
      material: await getMaterial(adaptation.materialId),
    })),
  );

  const totalSeconds = sessions.reduce((a, s) => a + s.durationSeconds, 0);
  const correct = records.filter((r) => r.isCorrect).length;
  const accuracy = records.length ? Math.round((correct / records.length) * 100) : 0;
  const publishedCount = materialTitles.filter(
    ({ adaptation, material }) =>
      adaptation.status === "approved" && material?.status === "published",
  ).length;
  const completed = sessions.filter((s) => s.completedAt).length;
  const qrClassId = tokens[0]?.classId || classes[0]?.id || "";

  const sessionRows = await Promise.all(
    sessions.map(async (session) => {
      const adaptation = session.materialAdaptationId
        ? await getAdaptationById(session.materialAdaptationId)
        : null;
      const material = adaptation ? await getMaterial(adaptation.materialId) : null;
      return {
        session,
        materialTitle: material?.title ?? "Materi pilihan siswa",
        recordCount: records.filter((r) => r.sessionId === session.id).length,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/siswa">
          <ArrowLeft />
          Semua siswa
        </Link>
      </Button>

      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-5 pt-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 shrink-0">
              <AvatarImage src={student.photoUrl} alt="" />
              <AvatarFallback className="text-lg">
                {initialsOf(student.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold">
                {student.fullName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Dipanggil {student.nickname} - {student.age} tahun -{" "}
                {student.gender === "L" ? "Laki-laki" : "Perempuan"} - masuk sejak{" "}
                {formatTanggal(student.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DisabilityBadge
                  label={DISABILITY_LABELS[student.disabilityType] ?? student.disabilityType}
                />
                {profile ? (
                  <ToneBadge
                    label={`Kemampuan akademik: ${LEVEL_LABELS[profile.academicLevel]}`}
                    tone={profile.academicLevel === "low" ? "warning" : "info"}
                  />
                ) : (
                  <ToneBadge label="Profil belum diisi" tone="destructive" />
                )}
                <ToneBadge
                  label={
                    tokens.some((t) => t.isActive)
                      ? "Akses QR aktif"
                      : "Akses QR nonaktif"
                  }
                  tone={tokens.some((t) => t.isActive) ? "success" : "destructive"}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/progres/${student.id}`}>
                <ChartNoAxesColumn />
                Lihat progres
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/ppi/baru">
                <FileText />
                Susun PPI
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/siswa/${student.id}/ubah`}>
                <PencilLine />
                Ubah data siswa
              </Link>
            </Button>
            <StudentActions student={student} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Sesi belajar</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {sessions.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completed} sesi diselesaikan sampai akhir
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Waktu belajar</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {formatDurasi(totalSeconds)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rata-rata {sessions.length ? Math.round(totalSeconds / sessions.length / 60) : 0} menit per sesi
          </p>
        </Card>
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Ketepatan jawaban</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {accuracy}%
          </p>
          <Progress value={accuracy} className="mt-2" aria-label="Ketepatan jawaban siswa" />
        </Card>
        <Card className="border-border/80 p-4">
          <p className="text-sm text-muted-foreground">Materi terbit</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
            {publishedCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Dari {adaptations.length} versi adaptasi yang dibuat
          </p>
        </Card>
      </div>

      {profile ? (
        <Card className="border-border/80">
          <CardContent className="grid gap-6 pt-6 lg:grid-cols-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Target className="size-4 text-primary" aria-hidden="true" />
                Ringkasan profil belajar
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Diperbarui {formatTanggal(profile.updatedAt)}. Semua angka ini
                menjadi bahan adaptasi AI dan pengaturan tampilan layar siswa.
              </p>
              <Separator className="my-4" />
              <InteractionModeList modes={profile.interactionModes} />
            </div>
            <div>
              <p className="text-sm font-semibold">Kemampuan akademik</p>
              <SkillBarList
                className="mt-3"
                items={[
                  { label: "Membaca", value: profile.academicDetails.membaca },
                  { label: "Menulis", value: profile.academicDetails.menulis },
                  { label: "Berhitung", value: profile.academicDetails.berhitung },
                ]}
              />
              <p className="mt-4 text-sm font-semibold">Preferensi belajar</p>
              <PreferenceChips
                className="mt-3"
                preferences={profile.learningPreferences}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Catatan guru</p>
              <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
                {student.notes || "Belum ada catatan tambahan dari guru."}
              </p>
              <div>
                <p className="text-sm font-semibold">Dokumen PPI</p>
                {ppi.length ? (
                  <ul className="mt-2 space-y-2">
                    {ppi.map((doc) => (
                      <li key={doc.id}>
                        <Link
                          href={`/dashboard/ppi/${doc.id}`}
                          className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
                        >
                          <span className="min-w-0 truncate">
                            PPI Tahun Ajaran {doc.academicYear}
                          </span>
                          <ToneBadge
                            label={doc.status === "final" ? "Final" : "Draft"}
                            tone={doc.status === "final" ? "success" : "warning"}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Belum ada dokumen PPI untuk tahun ajaran ini.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-5 text-destructive" aria-hidden="true" />
              <div>
                <p className="font-heading text-sm font-semibold">
                  Profil belajar belum lengkap
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Materi tidak boleh diadaptasi sebelum profil kemampuan dan bentuk
                  interaksi siswa terisi. Lengkapi pemetaan terlebih dahulu.
                </p>
              </div>
            </div>
<Button asChild>
              <Link href={`/dashboard/siswa/${student.id}/ubah`}>
                <PencilLine />
                Lengkapi pemetaan
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="kelas">
        <TabsList>
          <TabsTrigger value="kelas">Kelas</TabsTrigger>
          <TabsTrigger value="materi">Materi</TabsTrigger>
          <TabsTrigger value="progres">Progres</TabsTrigger>
        </TabsList>

        <TabsContent value="kelas" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {classes.map((item) => {
              const classToken = tokens.find((t) => t.classId === item.id);
              return (
                <Card key={item.id} className="border-border/80">
                  <CardContent className="flex items-start justify-between gap-3 pt-6">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-heading text-base font-semibold">
                        <GraduationCap className="size-4 text-primary" aria-hidden="true" />
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.subject} - ruang {item.room}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ToneBadge
                      label={classToken?.isActive ? "QR aktif" : "QR nonaktif"}
                      tone={classToken?.isActive ? "success" : "destructive"}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/80">
            <CardContent className="pt-6">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="size-4 text-primary" aria-hidden="true" />
                Token akses siswa
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Setiap kelas punya token sendiri. Token tidak memuat identitas
                siswa, hanya akses acak yang berlaku sampai akhir tahun ajaran.
              </p>
              <ul className="mt-4 space-y-2">
                {tokens.map((token) => (
                  <li
                    key={token.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {classes.find((c) => c.id === token.classId)?.name ??
                          "Kelas dihapus"}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        Teks token tersimpan sebagai hash di server
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Berlaku sampai {formatTanggal(token.expiresAt)}
                      </p>
                    </div>
                    <ToneBadge
                      label={token.isActive ? "Aktif" : "Nonaktif"}
                      tone={token.isActive ? "success" : "destructive"}
                    />
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link href={`/dashboard/kelas/${qrClassId}/qr`}>
                  <QrCode />
                  Kelola kartu QR
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materi" className="space-y-3">
          {materialTitles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Belum ada materi untuk siswa ini"
              description="Unggah materi dan pilih siswa ini sebagai target agar versi adaptasi personal dibuat otomatis."
              action={
                <Button asChild>
                  <Link href="/dashboard/materi/baru">Unggah materi</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {materialTitles.map(({ adaptation, material }) => {
                const status = ADAPTATION_STATUS[adaptation.status];
                return (
                  <li key={adaptation.id}>
                    <Card className="h-full border-border/80 transition-colors hover:border-primary/40">
                      <CardContent className="flex h-full flex-col gap-3 pt-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-heading text-base font-semibold">
                              {material?.title ?? "Materi dihapus"}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {material?.subject} - {adaptation.adaptedContent.sections.length} bagian
                            </p>
                          </div>
                          <ToneBadge label={status.label} tone={status.tone} />
                        </div>
                        {adaptation.teacherEdits.length > 0 ? (
                          <p className="rounded-lg bg-info/8 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            {adaptation.teacherEdits.length} suntingan guru tersimpan
                            pada revisi ini.
                          </p>
                        ) : null}
                        <div className="mt-auto flex gap-2">
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link
                              href={`/dashboard/materi/${adaptation.materialId}/adaptasi/${student.id}`}
                            >
                              {adaptation.status === "approved" ? "Tinjau" : "Lengkapi"}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="progres" className="space-y-3">
          {sessions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum ada sesi belajar"
              description="Riwayat sesi akan muncul setelah siswa membuka materi lewat QR dan menyelesaikan setidaknya satu bagian."
            />
          ) : (
            <Card className="border-border/80">
              <CardContent className="pt-6">
                <ul className="divide-y">
                  {sessionRows.map(({ session, materialTitle, recordCount }) => (
                      <li key={session.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{materialTitle}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatTanggalPendek(session.startedAt)} -{" "}
                            {formatWaktu(session.startedAt)} -{" "}
                            {formatDurasi(session.durationSeconds)} - {recordCount} interaksi
                          </p>
                        </div>
                        <ToneBadge
                          label={session.completedAt ? "Selesai" : "Belum selesai"}
                          tone={session.completedAt ? "success" : "warning"}
                        />
                      </li>
                    ))}
                </ul>
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href={`/dashboard/progres/${student.id}`}>
                    <ChartNoAxesColumn />
                    Buka timeline lengkap
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}