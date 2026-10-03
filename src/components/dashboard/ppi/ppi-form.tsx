"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldSet } from "@/components/dashboard/field";
import { TagInput } from "@/components/dashboard/tag-input";
import { WizardProgress, type WizardStep } from "@/components/dashboard/wizard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToneBadge } from "@/components/dashboard/feedback";
import { LEVEL_LABELS } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Save, Trash2, WandSparkles } from "lucide-react";

export type PpiStudentOption = {
  id: string;
  fullName: string;
  nickname: string;
  photoUrl: string;
  disabilityLabel: string;
  academicLevel: string;
  sessions: number;
  accuracy: number;
  minutes: number;
  auto: {
    strengths: string;
    needs: string[];
    objectives: string[];
    services: string[];
    schedule: { day: string; time: string; activity: string }[];
    materials: string[];
    evaluation: string;
    familyNotes: string;
  };
};

const STEPS: WizardStep[] = [
  {
    id: "siswa",
    title: "Pilih Siswa",
    description: "Pilih siswa dan tahun ajaran dokumen.",
  },
  {
    id: "asesmen",
    title: "Hasil Asesmen",
    description: "Kekuatan, kebutuhan, dan tujuan yang terisi otomatis.",
  },
  {
    id: "rencana",
    title: "Rencana Intervention",
    description: "Layanan, jadwal, bahan, evaluasi, dan tanda tangan.",
  },
];

type FormValues = {
  studentId: string;
  academicYear: string;
  strengths: string;
  needs: string[];
  objectives: string[];
  services: string[];
  schedule: { day: string; time: string; activity: string }[];
  materials: string[];
  evaluation: string;
  familyNotes: string;
  teacherSignature: string;
  headmasterSignature: string;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function PpiForm({
  students,
  teacherName,
}: {
  students: PpiStudentOption[];
  teacherName: string;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [dirty, setDirty] = React.useState(false);

  const [values, setValues] = React.useState<FormValues>({
    studentId: "",
    academicYear: "2026/2027",
    strengths: "",
    needs: [],
    objectives: [],
    services: [],
    schedule: [{ day: "Senin", time: "08.00-08.40", activity: "" }],
    materials: [],
    evaluation: "",
    familyNotes: "",
    teacherSignature: teacherName,
    headmasterSignature: "",
  });

  const student = students.find((item) => item.id === values.studentId);

  function update<K extends keyof FormValues>(key: K, next: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: next }));
    setDirty(true);
  }

  function applyAuto(nextStudent: PpiStudentOption) {
    setValues((current) => ({
      ...current,
      studentId: nextStudent.id,
      strengths: current.strengths || nextStudent.auto.strengths,
      needs: current.needs.length ? current.needs : nextStudent.auto.needs,
      objectives: current.objectives.length ? current.objectives : nextStudent.auto.objectives,
      services: current.services.length ? current.services : nextStudent.auto.services,
      schedule:
        current.schedule[0]?.activity
          ? current.schedule
          : nextStudent.auto.schedule.map((row) => ({ ...row })),
      materials: current.materials.length ? current.materials : nextStudent.auto.materials,
      evaluation: current.evaluation || nextStudent.auto.evaluation,
      familyNotes: current.familyNotes || nextStudent.auto.familyNotes,
    }));
    setDirty(true);
  }

  async function goNext() {
    if (step === 0 && !values.studentId) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }
    if (step === 1) {
      if (values.strengths.trim().length < 10) {
        toast.error("Tuliskan kekuatan siswa minimal 10 karakter");
        return;
      }
      if (values.needs.length === 0 || values.objectives.length === 0) {
        toast.error("Cantumkan minimal satu kebutuhan dan satu tujuan pembelajaran");
        return;
      }
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit() {
    if (values.services.length === 0 || values.evaluation.trim().length < 10) {
      toast.error("Lengkapi layanan dan rencana evaluasi");
      return;
    }
    toast.success("Dokumen PPI disimpan sebagai draft", {
      description: "Draft bisa disimpan berulang tanpa batas sebelum Anda finalkan.",
    });
    router.push("/dashboard/ppi");
  }

  return (
    <div className="space-y-6">
      <WizardProgress steps={STEPS} current={step} />

      {step === 0 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tahun ajaran" htmlFor="academicYear" required>
                <Select
                  value={values.academicYear}
                  onValueChange={(value) => update("academicYear", value)}
                >
                  <SelectTrigger id="academicYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026/2027">2026/2027</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Siswa" htmlFor="studentId" required>
                <Select
                  value={values.studentId}
                  onValueChange={(value) => {
                    const next = students.find((item) => item.id === value);
                    if (next) applyAuto(next);
                  }}
                >
                  <SelectTrigger id="studentId">
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.fullName} - {item.disabilityLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {student ? (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={student.photoUrl} alt="" />
                    <AvatarFallback>{initialsOf(student.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-heading text-base font-semibold">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      Dipanggil {student.nickname} - {student.disabilityLabel}
                    </p>
                  </div>
                  <ToneBadge
                    className="ml-auto"
                    label={LEVEL_LABELS[student.academicLevel]}
                    tone={student.academicLevel === "low" ? "warning" : "info"}
                  />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div>
                    <dt className="text-xs text-muted-foreground">Sesi belajar</dt>
                    <dd className="font-heading text-lg font-semibold tabular-nums">
                      {student.sessions}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Menit belajar</dt>
                    <dd className="font-heading text-lg font-semibold tabular-nums">
                      {student.minutes}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ketepatan</dt>
                    <dd className="font-heading text-lg font-semibold tabular-nums">
                      {student.accuracy}%
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
                Pilih siswa untuk melihat ringkasan profil dan progres terakhir. Data
                tersebut dipakai untuk mengisi awal dokumen secara otomatis.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-start gap-2 rounded-lg bg-info/8 p-3">
              <WandSparkles className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Isian di bawah sudah dilengkapi dari profil belajar dan respons
               terakhir siswa. Anda bebas mengubah setiap butir sebelum disimpan.
              </p>
            </div>

            <Field
              label="Kekuatan siswa"
              htmlFor="strengths"
              required
              hint="Tulis kondisi terbaik siswa yang bisa dimanfaatkan untuk kegiatan belajar."
            >
              <Textarea
                id="strengths"
                rows={3}
                value={values.strengths}
                onChange={(event) => update("strengths", event.target.value)}
              />
            </Field>

            <TagInput
              id="needs"
              label="Kebutuhan siswa"
              required
              hint="Minimal satu butir. Setiap butir akan menjadi acuan tujuan pembelajaran."
              placeholder="Contoh: membaca kalimat pendek"
              suggestions={["Butuh pendampingan penuh", "Perlu media bergambar", "Mudah lelah", "Perlu waktu tambahan"]}
              value={values.needs}
              onChange={(next) => update("needs", next)}
            />

            <TagInput
              id="objectives"
              label="Tujuan pembelajaran"
              required
              hint="Tulis dengan format: siswa mampu ... , lalu tambahkan kriteria keberhasilannya."
              placeholder="Contoh: siswa mampu menyebutkan 5 nama anggota keluarga"
              suggestions={[
                "Siswa mampu menyebutkan nama anggota keluarga",
                "Siswa mampu menghitung benda sampai 10",
                "Siswa mampu menyapa dengan kalimat pendek",
              ]}
              value={values.objectives}
              onChange={(next) => update("objectives", next)}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <Card className="border-border/80">
            <CardContent className="space-y-5 pt-6">
              <TagInput
                id="services"
                label="Layanan yang diberikan"
                required
                hint="Tulis bentuk layanan konkret, misalnya pendampingan guru saat mengerjakan tugas."
                placeholder="Contoh: pendampingan penuh saat belajar"
                suggestions={[
                  "Pendampingan guru saat mengerjakan tugas",
                  "Kelas kecil maksimal 6 siswa",
                  "Media audio untuk setiap materi baru",
                ]}
                value={values.services}
                onChange={(next) => update("services", next)}
              />

              <TagInput
                id="materials"
                label="Bahan dan alat"
                hint="Bahan yang disiapkan guru untuk mendukung layanan di atas."
                placeholder="Contoh: kartu angka berukuran besar"
                suggestions={["Kartu bergambar", "Benda konkret", "Papan komunikasi", "Speaker audio kelas"]}
                value={values.materials}
                onChange={(next) => update("materials", next)}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Jadwal kegiatan</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update("schedule", [
                      ...values.schedule,
                      { day: "Selasa", time: "09.00-09.40", activity: "" },
                    ])
                  }
                >
                  Tambah jadwal
                </Button>
              </div>

              <ul className="space-y-2">
                {values.schedule.map((row, index) => (
                  <li key={index} className="grid gap-2 sm:grid-cols-[8rem_10rem_1fr_auto]">
                    <Select
                      value={row.day}
                      onValueChange={(value) =>
                        update(
                          "schedule",
                          values.schedule.map((item, i) =>
                            i === index ? { ...item, day: value } : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger aria-label={`Hari jadwal ${index + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={row.time}
                      aria-label={`Jam jadwal ${index + 1}`}
                      onChange={(event) =>
                        update(
                          "schedule",
                          values.schedule.map((item, i) =>
                            i === index ? { ...item, time: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Input
                      value={row.activity}
                      placeholder="Contoh: Latih matematika: mengenal angka 1 sampai 5"
                      aria-label={`Kegiatan jadwal ${index + 1}`}
                      onChange={(event) =>
                        update(
                          "schedule",
                          values.schedule.map((item, i) =>
                            i === index ? { ...item, activity: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={values.schedule.length <= 1}
                      aria-label={`Hapus jadwal ${index + 1}`}
                      onClick={() =>
                        update(
                          "schedule",
                          values.schedule.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-5 pt-6">
              <FieldSet
                legend="Evaluasi"
                required
                description="Tulis cara dan waktu evaluasi agar dapat diukur hasilnya."
              >
                <Textarea
                  rows={3}
                  value={values.evaluation}
                  placeholder="Contoh: observasi guru dengan lembar periksa setiap akhir pekan."
                  onChange={(event) => update("evaluation", event.target.value)}
                />
              </FieldSet>

              <Field
                label="Catatan untuk keluarga"
                htmlFor="familyNotes"
                hint="Komunikasi yang perlu disampaikan kepada orang tua."
              >
                <Textarea
                  id="familyNotes"
                  rows={3}
                  value={values.familyNotes}
                  onChange={(event) => update("familyNotes", event.target.value)}
                />
              </Field>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Tanda tangan guru" htmlFor="teacherSignature" required>
                  <Input
                    id="teacherSignature"
                    value={values.teacherSignature}
                    onChange={(event) => update("teacherSignature", event.target.value)}
                  />
                </Field>
                <Field
                  label="Tanda tangan kepala sekolah"
                  htmlFor="headmasterSignature"
                  hint="Dapat diisi setelah dokumen difinalkan."
                >
                  <Input
                    id="headmasterSignature"
                    value={values.headmasterSignature}
                    onChange={(event) => update("headmasterSignature", event.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/ppi")}
          >
            <ArrowLeft />
            Batal
          </Button>
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
            >
              <ArrowLeft />
              Kembali
            </Button>
          ) : null}
        </div>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Lanjut
            <ArrowRight />
          </Button>
        ) : (
          <Button type="button" onClick={onSubmit} disabled={!dirty && !student}>
            <Save />
            Simpan sebagai draft
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <Link href="/panduan#progres-ppi" className="underline underline-offset-4">
          Baca panduan penyusunan PPI
        </Link>{" "}
        bila Anda belum pernah menyusun dokumen ini.
      </p>
    </div>
  );
}