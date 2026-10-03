"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldSet } from "@/components/dashboard/field";
import { TagInput } from "@/components/dashboard/tag-input";
import { ToneBadge } from "@/components/dashboard/feedback";
import { Save, FileDown, Printer, ShieldCheck } from "lucide-react";
import type { PpiDocument, PpiContent, Student, TeacherProfile } from "@/lib/dummy/types";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function PpiEditor({
  document: ppi,
  student,
  teacher,
}: {
  document: PpiDocument;
  student: Student | null;
  teacher: TeacherProfile;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState(ppi.status);
  const [content, setContent] = React.useState(ppi.content);
  const [tab, setTab] = React.useState("editor");

  function update<K extends keyof PpiContent>(key: K, value: PpiContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function updateSchedule(
    index: number,
    patch: Partial<PpiContent["schedule"][number]>,
  ) {
    update(
      "schedule",
      content.schedule.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function saveDraft() {
    toast.success("Draft PPI tersimpan", {
      description: "Dokumen draft boleh diperbaiki berkali-kali tanpa batas.",
    });
    router.refresh();
  }

  function markFinal() {
    setStatus("final");
    toast.success("Dokumen ditandai final", {
      description: "Dokumen final dapat diekspor ke PDF dan dibagikan kepada sekolah.",
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="editor">Sunting</TabsTrigger>
            <TabsTrigger value="preview">Pratinjau cetak</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="no-print flex flex-wrap items-center gap-2">
          <ToneBadge
            label={status === "final" ? "Dokumen final" : "Draft"}
            tone={status === "final" ? "success" : "warning"}
          />
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Cetak
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <FileDown />
            Ekspor PDF
          </Button>
          {status !== "final" ? (
            <Button variant="outline" onClick={saveDraft}>
              <Save />
              Simpan draft
            </Button>
          ) : null}
          <Button onClick={markFinal} disabled={status === "final"}>
            <ShieldCheck />
            Tandai final
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsContent value="editor" className="space-y-4">
          <Card className="border-border/80">
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Siswa" htmlFor="ppi-student">
                  <Input
                    id="ppi-student"
                    readOnly
                    value={student?.fullName ?? "Siswa tidak ditemukan"}
                  />
                </Field>
                <Field label="Tahun ajaran" htmlFor="ppi-year">
                  <Input id="ppi-year" readOnly value={ppi.academicYear} />
                </Field>
              </div>

              <Field
                label="Kekuatan siswa"
                htmlFor="strengths"
                hint="Kondisi terbaik siswa yang dimanfaatkan pada kegiatan belajar."
              >
                <Textarea
                  id="strengths"
                  rows={3}
                  value={content.strengths}
                  onChange={(event) => update("strengths", event.target.value)}
                />
              </Field>

              <TagInput
                id="needs"
                label="Kebutuhan siswa"
                required
                hint="Setiap butir kebutuhan menjadi acuan tujuan pembelajaran di bawah."
                placeholder="Contoh: membaca kalimat pendek"
                suggestions={["Butuh pendampingan penuh", "Perlu media bergambar", "Mudah lelah"]}
                value={content.needs}
                onChange={(next) => update("needs", next)}
              />

              <TagInput
                id="objectives"
                label="Tujuan pembelajaran"
                required
                hint="Rumuskan dengan kalimat yang dapat diamati dan diukur guru."
                placeholder="Contoh: siswa mampu menyebutkan 5 nama anggota keluarga"
                suggestions={[
                  "Siswa mampu menyapa dengan kalimat pendek",
                  "Siswa mampu menghitung benda sampai 10",
                ]}
                value={content.objectives}
                onChange={(next) => update("objectives", next)}
              />

              <TagInput
                id="services"
                label="Layanan yang diberikan"
                required
                hint="Bentuk layanan konkret yang disiapkan di halaman sekolah."
                placeholder="Contoh: pendampingan penuh saat mengerjakan tugas"
                suggestions={[
                  "Pendampingan guru saat mengerjakan tugas",
                  "Kelas kecil maksimal 6 siswa",
                  "Media audio untuk setiap materi baru",
                ]}
                value={content.services}
                onChange={(next) => update("services", next)}
              />

              <TagInput
                id="materials"
                label="Bahan dan alat"
                hint="Bahan yang disiapkan guru untuk mendukung layanan."
                placeholder="Contoh: kartu angka berukuran besar"
                suggestions={["Kartu bergambar", "Benda konkret", "Papan komunikasi"]}
                value={content.materials}
                onChange={(next) => update("materials", next)}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Jadwal kegiatan</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update("schedule", [
                      ...content.schedule,
                      { day: "Selasa", time: "09.00-09.40", activity: "" },
                    ])
                  }
                >
                  Tambah jadwal
                </Button>
              </div>
              <ul className="space-y-2">
                {content.schedule.map((row, index) => (
                  <li key={index} className="grid gap-2 sm:grid-cols-[8rem_10rem_1fr]">
                    <select
                      value={row.day}
                      aria-label={`Hari jadwal ${index + 1}`}
                      onChange={(event) => updateSchedule(index, { day: event.target.value })}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
                    >
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={row.time}
                      aria-label={`Jam jadwal ${index + 1}`}
                      onChange={(event) => updateSchedule(index, { time: event.target.value })}
                    />
                    <Input
                      value={row.activity}
                      aria-label={`Kegiatan jadwal ${index + 1}`}
                      onChange={(event) => updateSchedule(index, { activity: event.target.value })}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-5 pt-6">
              <FieldSet legend="Evaluasi" required>
                <Textarea
                  rows={3}
                  value={content.evaluation}
                  onChange={(event) => update("evaluation", event.target.value)}
                />
              </FieldSet>

              <Field
                label="Catatan untuk keluarga"
                htmlFor="familyNotes"
                hint="Draf pesan yang disampaikan kepada orang tua."
              >
                <Textarea
                  id="familyNotes"
                  rows={3}
                  value={content.familyNotes}
                  onChange={(event) => update("familyNotes", event.target.value)}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Tanda tangan guru" htmlFor="teacherSignature">
                  <Input
                    id="teacherSignature"
                    value={content.teacherSignature}
                    onChange={(event) => update("teacherSignature", event.target.value)}
                  />
                </Field>
                <Field label="Tanda tangan kepala sekolah" htmlFor="headmasterSignature">
                  <Input
                    id="headmasterSignature"
                    value={content.headmasterSignature}
                    placeholder="Diisi setelah dokumen difinalkan"
                    onChange={(event) =>
                      update("headmasterSignature", event.target.value)
                    }
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="print-page mx-auto max-w-[52rem] border-border/80 bg-white text-black">
            <CardContent className="space-y-5 p-8 pt-8">
              <header className="space-y-1 border-b-2 border-black pb-4 text-center">
                <p className="text-sm font-semibold">PEMERINTAH KOTA YOGYAKARTA</p>
                <p className="text-sm font-semibold">DINAS PENDIDIKAN</p>
                <p className="text-base font-bold">{teacher.schoolName}</p>
                <p className="text-xs">
                  Alamat: Jl. Kaliurang Km 5, Sleman, Yogyakarta - Telepon 0271 123 456
                </p>
                <h1 className="pt-3 text-lg font-bold uppercase">
                  Program Individu Plansional
                </h1>
                <p className="text-sm">Tahun Ajaran {ppi.academicYear}</p>
              </header>

              <section className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="font-semibold">Nama Siswa:</span>{" "}
                  {student?.fullName ?? "-"}
                </p>
                <p>
                  <span className="font-semibold">Kelas:</span>{" "}
                  {student ? `${student.age} tahun` : "-"}
                </p>
                <p>
                  <span className="font-semibold">Jenis Hambatan:</span>{" "}
                  {student ? student.disabilityType : "-"}
                </p>
                <p>
                  <span className="font-semibold">Guru:</span> {content.teacherSignature}
                </p>
              </section>

              <Section title="A. Kekuatan Siswa">
                <p className="text-sm leading-relaxed">{content.strengths}</p>
              </Section>

              <Section title="B. Kebutuhan Siswa">
                <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
                  {content.needs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </Section>

              <Section title="C. Tujuan Pembelajaran">
                <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
                  {content.objectives.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </Section>

              <Section title="D. Layanan yang Diberikan">
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {content.services.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Section>

              <Section title="E. Jadwal Kegiatan">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border border-black/60">
                      <th className="border border-black/60 px-2 py-1 text-left">Hari</th>
                      <th className="border border-black/60 px-2 py-1 text-left">Waktu</th>
                      <th className="border border-black/60 px-2 py-1 text-left">Kegiatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.schedule.map((row, index) => (
                      <tr key={index} className="border border-black/60">
                        <td className="border border-black/60 px-2 py-1">{row.day}</td>
                        <td className="border border-black/60 px-2 py-1">{row.time}</td>
                        <td className="border border-black/60 px-2 py-1">{row.activity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section title="F. Bahan dan Alat">
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {content.materials.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Section>

              <Section title="G. Rencana Evaluasi">
                <p className="text-sm leading-relaxed">{content.evaluation}</p>
              </Section>

              <Section title="H. Catatan untuk Keluarga">
                <p className="text-sm leading-relaxed">{content.familyNotes}</p>
              </Section>

              <section className="mt-8 grid gap-8 text-sm sm:grid-cols-2">
                <div>
                  <p>Yogyakarta, ......................</p>
                  <p className="mt-1">Orang Tua / Wali</p>
                  <p className="mt-12">................................</p>
                </div>
                <div>
                  <p>Yogyakarta, ......................</p>
                  <p className="mt-1">Kepala Sekolah</p>
                  <p className="mt-12">................................</p>
                </div>
              </section>

              <p className="border-t pt-3 text-center text-xs text-black/60">
                Dokumen disusun dengan Fitra - {teacher.schoolName} - Status{" "}
                {status === "final" ? "Final" : "Draft"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="no-print text-xs text-muted-foreground">
        <Link href="/dashboard/ppi" className="underline underline-offset-4">
          Kembali ke daftar PPI
        </Link>{" "}
        bila Anda sudah selesai menyimpan.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold uppercase">{title}</h2>
      {children}
    </section>
  );
}