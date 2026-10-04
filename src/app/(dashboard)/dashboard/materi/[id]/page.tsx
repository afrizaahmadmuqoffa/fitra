import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClass,
  getClassStudents,
  getMaterial,
  getMaterialAdaptations,
  getStudentProfile,
  getVisualAssets,
} from "@/db/queries";
import { ADAPTATION_STATUS, MATERIAL_STATUS } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  DisabilityBadge,
  EmptyState,
  ToneBadge,
  formatTanggal,
} from "@/components/dashboard/feedback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { GenerateAdaptationButton } from "@/components/dashboard/materi/generate-adaptation-button";
import { MateriActions } from "@/components/dashboard/materi/materi-actions";
import { ArrowLeft, FileText, Info, Layers, Sparkles } from "lucide-react";
import { LEVEL_LABELS } from "@/lib/constants";
import { DISABILITY_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Detail Materi",
  description:
    "Metadata materi, hasil analisis AI, dan status kurasi adaptasi per siswa.",
};

const SOURCE_LABEL: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  text: "Teks",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getMaterial(id);
  if (!material) notFound();

  const adaptations = await getMaterialAdaptations(id);
  const targetStudents = material.classId ? await getClassStudents(material.classId) : [];

  const rows = await Promise.all(
    targetStudents.map(async (student) => {
      const [profile, adaptation] = await Promise.all([
        getStudentProfile(student.id),
        adaptations.find((item) => item.studentId === student.id) ?? null,
      ]);
      const assets = adaptation ? await getVisualAssets(adaptation.id) : [];
      return {
        student,
        profile,
        adaptation,
        assets,
        readyAssets: assets.filter((asset) => asset.status === "ready").length,
        failedAssets: assets.filter((asset) => asset.status === "failed").length,
      };
    }),
  );

  const approvedCount = adaptations.filter((item) => item.status === "approved").length;
  const classInfo = material.classId ? await getClass(material.classId) : null;
  const status = MATERIAL_STATUS[material.status];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/materi">
          <ArrowLeft />
          Semua materi
        </Link>
      </Button>

      <PageHeader
        title={material.title}
        description={`${material.subject} - dibuat ${formatTanggal(material.createdAt)} - ${
          classInfo ? classInfo.name : "tanpa kelas target"
        }`}
        actions={
<MateriActions
              materialId={material.id}
              status={material.status}
              approvedCount={approvedCount}
              totalStudents={targetStudents.length}
            />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <ToneBadge label={`Status materi: ${status.label}`} tone={status.tone} />
        <Badge variant="secondary">{SOURCE_LABEL[material.sourceType] ?? material.sourceType}</Badge>
        <Badge variant="outline" className="font-mono text-[0.7rem]">
          {material.sourceFileName}
        </Badge>
        {material.aiAnalysis ? (
          <Badge variant="outline">
            Tingkat baca: {material.aiAnalysis.estimatedReadingLevel}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-heading text-base font-semibold">Hasil analisis AI</h2>
            </div>

            {material.aiAnalysis ? (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {material.aiAnalysis.summary}
                </p>
                <ol className="space-y-2">
                  {material.aiAnalysis.structure.map((section, index) => (
                    <li
                      key={section.title}
                      className="flex gap-3 rounded-lg border p-3"
                    >
                      <span
                        className="grid size-7 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-semibold text-accent-foreground"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{section.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {section.summary}
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {section.keyTerms.map((term) => (
                            <li key={term}>
                              <Badge variant="secondary" className="font-normal">
                                {term}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {material.aiAnalysis?.visualSections.includes(index) ? (
                        <ToneBadge label="Perlu ilustrasi" tone="info" className="ml-auto self-start" />
                      ) : null}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="Materi belum dianalisis AI"
                description="Tekan Proses ulang AI untuk memisahkan struktur bab dan menentukan bagian yang membutuhkan ilustrasi."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-heading text-base font-semibold">Teks sumber</h2>
            </div>
            <p className="max-h-72 overflow-y-auto rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
              {material.sourceText}
            </p>
            <p className="text-xs text-muted-foreground">
              {material.sourceText.length.toLocaleString("id-ID")} karakter
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-muted/40">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Materi hanya boleh diterbitkan bila minimal satu adaptasi berstatus
            disetujui. Saat ini {approvedCount} dari {adaptations.length} versi sudah
            disetujui untuk {targetStudents.length} siswa target.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Layers className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-lg font-semibold">Adaptasi per siswa</h2>
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link href={`/dashboard/materi/${material.id}/adaptasi`}>
              Lihat semua versi
              <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {targetStudents.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Belum ada kelas target"
            description="Materi ini belum ditautkan ke kelas, sehingga belum ada siswa yang menjadi target adaptasi."
          />
        ) : (
          <Card className="border-border/80">
            <ScrollArea className="w-full">
              <Table className="min-w-[54rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kemampuan</TableHead>
                    <TableHead>Status adaptasi</TableHead>
                    <TableHead>Ilustrasi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ student, profile, adaptation, readyAssets, failedAssets }) => {
                    const meta = adaptation
                      ? ADAPTATION_STATUS[adaptation.status]
                      : { label: "Belum dibuat", tone: "muted" as const };
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
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
                              <DisabilityBadge
                                className="mt-1"
                                label={DISABILITY_LABELS[student.disabilityType]}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {profile ? LEVEL_LABELS[profile.academicLevel] : "Profil kosong"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ToneBadge label={meta.label} tone={meta.tone} />
                          {adaptation ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {adaptation.adaptedContent.sections.length} bagian -{" "}
                              {adaptation.aiModel}
                              {adaptation.approvedAt
                                ? ` - disetujui ${formatTanggal(adaptation.approvedAt)}`
                                : ""}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {adaptation ? (
                            <span className="flex flex-col items-start gap-1">
                              <ToneBadge
                                label={`${readyAssets} siap`}
                                tone={readyAssets ? "success" : "muted"}
                              />
                              {failedAssets ? (
                                <ToneBadge
                                  label={`${failedAssets} gagal`}
                                  tone="destructive"
                                />
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {adaptation ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/dashboard/materi/${material.id}/adaptasi/${student.id}`}
                                >
                                  {adaptation.status === "generating"
                                    ? "Lihat proses"
                                    : adaptation.status === "approved"
                                      ? "Tinjau"
                                      : "Kurasi"}
                                </Link>
                              </Button>
                            ) : null}
                            <GenerateAdaptationButton
                              materialId={material.id}
                              studentId={student.id}
                              studentName={student.fullName}
                              sudahAda={Boolean(adaptation)}
                              disabledReason={
                                profile
                                  ? undefined
                                  : "Profil belajar belum lengkap"
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}