"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { WizardFooter } from "@/components/dashboard/wizard-footer";
import {
  AUDIO_SPEED_LABELS,
  CONTRAST_LABELS,
  DISABILITY_LABELS,
  INTERACTION_LABELS,
  LEVEL_LABELS,
  NAV_STYLE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { studentFormSchema, type StudentFormValues } from "@/lib/validation";
import { saveStudentFormAction } from "@/actions/students";
import { jalankanAction } from "@/lib/action-helpers";
import type { ClassRoom, Student, StudentProfile } from "@/db/types";

/**
 * Satu wizard untuk menambah maupun menyunting data siswa.
 *
 * Enam langkah: identitas, kelas dan catatan, kemampuan akademik,
 * sosial-emosional dan motorik, kemandirian, lalu preferensi dan interaksi.
 * Menambah dan menyunting memakai komponen yang sama supaya tidak ada isian
 * yang bisa berbeda di dua tempat.
 *
 * Langkah 3 sampai 5 memakai slider yang selalu punya nilai, jadi guru boleh
 * menekan Lanjut tanpa mengisi apa pun dan melengkapinya nanti.
 */

const STEPS: WizardStep[] = [
  {
    id: "identitas",
    title: "Identitas Siswa",
    description: "Nama, usia, jenis kelamin, dan jenis hambatan.",
  },
  {
    id: "kelas",
    title: "Kelas dan Catatan",
    description: "Masukkan siswa ke kelas dan tulis catatan penting.",
  },
  {
    id: "akademik",
    title: "Kemampuan Akademik",
    description: "Membaca, menulis, dan berhitung sebagai fondasi materi.",
  },
  {
    id: "sosial",
    title: "Sosial dan Motorik",
    description: "Interaksi dengan orang lain dan keterampilan gerak.",
  },
  {
    id: "mandiri",
    title: "Kemandirian",
    description: "Keterampilan bertahan hidup sehari-hari.",
  },
  {
    id: "preferensi",
    title: "Preferensi dan Interaksi",
    description: "Cara belajar, cara menjawab, dan tampilan layar.",
  },
];

const STEP_FIELDS: (keyof StudentFormValues)[][] = [
  ["fullName", "nickname", "age", "gender", "disabilityType"],
  ["classIds", "notes"],
  ["membaca", "menulis", "berhitung", "academicNotes"],
  [
    "mengenaliOrang",
    "bekerjaSama",
    "mengaturEmosi",
    "socialNotes",
    "motorHalus",
    "motorKasar",
    "motorNotes",
  ],
  ["dressed", "makan", "menggunakanAlat", "independenceNotes"],
  [
    "preferences",
    "interactions",
    "fontSize",
    "contrastMode",
    "audioEnabled",
    "audioSpeed",
    "navStyle",
    "strengths",
    "barriers",
  ],
];

const LEVELS: StudentProfile["academicLevel"][] = ["low", "medium", "high"];
const LEVEL_INDEX: Record<StudentProfile["academicLevel"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const INTERACTION_VALUES = ["touch", "speech", "keyboard", "switch", "drag"] as const;

const PREFERENCE_OPTIONS: {
  value: "visual" | "audio" | "kinestetik";
  label: string;
  hint: string;
}[] = [
  {
    value: "visual",
    label: "Visual",
    hint: "Lebih mudah dengan gambar, warna, dan diagram.",
  },
  {
    value: "audio",
    label: "Audio",
    hint: "Lebih mudah dengan penjelasan yang dibacakan.",
  },
  {
    value: "kinestetik",
    label: "Kinestetik",
    hint: "Lebih mudah dengan gerakan dan benda nyata.",
  },
];

function SkillSlider({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: StudentProfile["academicLevel"];
  onChange: (next: StudentProfile["academicLevel"]) => void;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm font-medium text-primary">{LEVEL_LABELS[value]}</span>
      </div>
      <Slider
        id={id}
        className="mt-4"
        min={0}
        max={2}
        step={1}
        value={[LEVEL_INDEX[value]]}
        onValueChange={(next) => onChange(LEVELS[next[0] ?? 1])}
        aria-label={label}
      />
      <div className="mt-3 flex justify-between gap-2 text-[0.7rem] text-muted-foreground">
        <span>Perlu pendampingan penuh</span>
        <span>Perlu bimbingan ringan</span>
        <span>Mandiri</span>
      </div>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function defaultsFrom(input: {
  student?: Student;
  profile?: StudentProfile | null;
  initialClassIds: string[];
}): StudentFormValues {
  const { student, profile, initialClassIds } = input;
  const level = profile?.academicLevel ?? "medium";
  const preferences = profile
    ? (Object.entries(profile.learningPreferences)
        .filter(([, value]) => value)
        .map(([key]) => key) as StudentFormValues["preferences"])
    : (["visual", "audio"] as const).slice() as StudentFormValues["preferences"];
  const interactions = profile
    ? (Object.entries(profile.interactionModes)
        .filter(([, value]) => value)
        .map(([key]) => key) as StudentFormValues["interactions"])
    : (["touch"] as const).slice() as StudentFormValues["interactions"];

  return {
    fullName: student?.fullName ?? "",
    nickname: student?.nickname ?? "",
    age: student?.age ?? 9,
    gender: student?.gender ?? "L",
    disabilityType: student?.disabilityType ?? "tunagrahita",
    classIds: initialClassIds,
    notes: student?.notes ?? "",
    membaca: profile?.academicDetails.membaca ?? level,
    menulis: profile?.academicDetails.menulis ?? level,
    berhitung: profile?.academicDetails.berhitung ?? level,
    academicNotes: profile?.academicDetails.catatan ?? "",
    mengenaliOrang: profile?.socialEmotional.mengenaliOrang ?? level,
    bekerjaSama: profile?.socialEmotional.bekerjaSama ?? level,
    mengaturEmosi: profile?.socialEmotional.mengaturEmosi ?? level,
    socialNotes: profile?.socialEmotional.catatan ?? "",
    motorHalus: profile?.motorSkills.motorHalus ?? level,
    motorKasar: profile?.motorSkills.motorKasar ?? level,
    motorNotes: profile?.motorSkills.catatan ?? "",
    dressed: profile?.independence.dressed ?? level,
    makan: profile?.independence.makan ?? level,
    menggunakanAlat: profile?.independence.menggunakanAlat ?? level,
    independenceNotes: profile?.independence.catatan ?? "",
    preferences,
    interactions,
    fontSize: profile?.uiTokens.fontSize ?? level,
    contrastMode: profile?.uiTokens.contrastMode ?? "normal",
    audioEnabled: profile?.uiTokens.audioEnabled ?? true,
    audioSpeed: profile?.uiTokens.audioSpeed ?? "normal",
    navStyle: profile?.uiTokens.navStyle ?? "step",
    strengths: [],
    barriers: [],
  };
}

export function StudentWizard({
  mode,
  classes,
  student,
  profile,
  initialClassIds = [],
}: {
  mode: "buat" | "ubah";
  classes: ClassRoom[];
  student?: Student;
  profile?: StudentProfile | null;
  initialClassIds?: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [step, setStep] = React.useState(0);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    mode: "onTouched",
    defaultValues: defaultsFrom({ student, profile, initialClassIds }),
  });

  const values = useWatch({ control: form.control }) as StudentFormValues;
  const isEdit = mode === "ubah" && student;

  const filled = React.useMemo(() => {
    const required = [
      "membaca",
      "menulis",
      "berhitung",
      "mengenaliOrang",
      "bekerjaSama",
      "motorHalus",
      "motorKasar",
      "dressed",
      "makan",
      "menggunakanAlat",
    ] as const;
    const done = required.filter((key) => Boolean(values[key])).length;
    return Math.round((done / required.length) * 100);
  }, [values]);

  async function goNext(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();

    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) {
      toast.error("Periksa kembali isian pada langkah ini");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(input: StudentFormValues) {
    setPending(true);
    try {
      const result = await jalankanAction(() =>
        saveStudentFormAction({ studentId: student?.id, values: input }),
      );

      if (!result.ok) {
        toast.error(
          isEdit ? "Perubahan belum tersimpan" : "Siswa belum tersimpan",
          { description: result.message },
        );
        return;
      }

      const kelas = classes
        .filter((item) => input.classIds.includes(item.id))
        .map((item) => item.name);

      toast.success(result.message, {
        description:
          kelas.length > 0
            ? `Kelas: ${kelas.join(", ")}. Profil belajar siap jadi bahan adaptasi materi.`
            : "Profil belajar siap jadi bahan adaptasi. Tambahkan siswa ke kelas agar bisa mendapat akses QR.",
      });

      router.push(isEdit ? `/dashboard/siswa/${student?.id}` : "/dashboard/siswa");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const submitLabel = isEdit ? "Simpan perubahan" : "Simpan siswa";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border/80 bg-muted/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-semibold">Kelengkapan pemetaan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Materi hanya boleh diproses setelah minimal kemampuan akademik dan bentuk
              interaksi terisi.
            </p>
          </div>
          <p className="font-heading text-2xl font-semibold tabular-nums">{filled}%</p>
        </CardContent>
      </Card>

      <WizardProgress steps={STEPS} current={step} />

      {step === 0 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Nama lengkap"
                htmlFor="fullName"
                required
                error={form.formState.errors.fullName?.message}
              >
                <Input
                  id="fullName"
                  placeholder="Contoh: Aisyah Putri Ramadhani"
                  aria-invalid={Boolean(form.formState.errors.fullName)}
                  {...form.register("fullName")}
                />
              </Field>

              <Field
                label="Nama panggilan"
                htmlFor="nickname"
                hint="Dipakai untuk menyapa siswa di layar belajar."
                error={form.formState.errors.nickname?.message}
              >
                <Input
                  id="nickname"
                  placeholder="Contoh: Aisyah"
                  aria-invalid={Boolean(form.formState.errors.nickname)}
                  {...form.register("nickname")}
                />
              </Field>

              <Field
                label="Usia"
                htmlFor="age"
                required
                error={form.formState.errors.age?.message}
              >
                <Input
                  id="age"
                  type="number"
                  min={3}
                  max={25}
                  aria-invalid={Boolean(form.formState.errors.age)}
                  {...form.register("age", { valueAsNumber: true })}
                />
              </Field>

              <FieldSet
                legend="Jenis kelamin"
                required
                error={form.formState.errors.gender?.message}
              >
                <RadioGroup
                  value={values.gender}
                  onValueChange={(value) =>
                    form.setValue("gender", value as StudentFormValues["gender"], {
                      shouldValidate: true,
                    })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="L" id="gender-L" />
                    <Label htmlFor="gender-L">Laki-laki</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="P" id="gender-P" />
                    <Label htmlFor="gender-P">Perempuan</Label>
                  </div>
                </RadioGroup>
              </FieldSet>
            </div>

            <Field
              label="Jenis hambatan"
              required
              hint="Dipakai untuk menentukan rekomendasi adaptasi materi dan tampilan antarmuka."
              error={form.formState.errors.disabilityType?.message}
            >
              <Select
                value={values.disabilityType}
                onValueChange={(value) =>
                  form.setValue(
                    "disabilityType",
                    value as StudentFormValues["disabilityType"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="disabilityType" aria-label="Jenis hambatan siswa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISABILITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-5 pt-6">
            <FieldSet
              legend="Masukkan ke kelas"
              description="Satu siswa boleh mengikuti lebih dari satu kelas. Tiap kelas punya token QR sendiri."
            >
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kelas. Buat kelas terlebih dahulu di halaman Kelas.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {classes.map((item) => {
                    const checked = values.classIds.includes(item.id);
                    return (
                      <li key={item.id}>
                        <label
                          htmlFor={`class-${item.id}`}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                            checked
                              ? "border-primary bg-accent/50"
                              : "border-border hover:bg-muted/60",
                          )}
                        >
                          <Checkbox
                            id={`class-${item.id}`}
                            className="mt-0.5"
                            checked={checked}
                            onCheckedChange={(value) => {
                              const next =
                                value === true
                                  ? [...values.classIds, item.id]
                                  : values.classIds.filter((id) => id !== item.id);
                              form.setValue("classIds", next, { shouldValidate: true });
                            }}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{item.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {item.subject} - {item.room}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </FieldSet>

            <Field
              label="Catatan guru"
              htmlFor="notes"
              hint="Misalnya kebiasaan belajar, kebutuhan khusus saat ujian, atau komunikasi yang dipakai."
              error={form.formState.errors.notes?.message}
            >
              <Textarea
                id="notes"
                rows={4}
                placeholder="Contoh: biasanya menggunakan kalimat singkat dan lebih mudah memahami lewat gambar."
                {...form.register("notes")}
              />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Geser setiap kemampuan sesuai kondisi siswa hari ini. Tidak ada nilai
              benar atau salah, ini bahan penyesuaian materi.
            </p>
            <SkillSlider
              id="membaca"
              label="Membaca"
              value={values.membaca}
              onChange={(next) => form.setValue("membaca", next)}
              hint="Materi baca akan disederhanakan bila kemampuan ini rendah."
            />
            <SkillSlider
              id="menulis"
              label="Menulis"
              value={values.menulis}
              onChange={(next) => form.setValue("menulis", next)}
              hint="Menentukan apakah siswa memakai pilihan sentuh atau mengetik jawaban."
            />
            <SkillSlider
              id="berhitung"
              label="Berhitung"
              value={values.berhitung}
              onChange={(next) => form.setValue("berhitung", next)}
            />
            <Field
              label="Catatan akademik"
              htmlFor="academicNotes"
              hint="Misalnya huruf yang sudah dikuasai, alat bantu yang biasa dipakai, atau kendala saat mengerjakan tugas."
              error={form.formState.errors.academicNotes?.message}
            >
              <Textarea
                id="academicNotes"
                rows={3}
                placeholder="Contoh: sudah mengenal huruf vokal, masih kesulitan untuk huruf bersambung."
                {...form.register("academicNotes")}
              />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <Card className="border-border/80">
            <CardContent className="space-y-4 pt-6">
              <SkillSlider
                id="mengenaliOrang"
                label="Mengenali orang di sekitar"
                value={values.mengenaliOrang}
                onChange={(next) => form.setValue("mengenaliOrang", next)}
              />
              <SkillSlider
                id="bekerjaSama"
                label="Bekerja sama dalam kelompok"
                value={values.bekerjaSama}
                onChange={(next) => form.setValue("bekerjaSama", next)}
                hint="Materi kelompok selalu disertai peran yang jelas untuk siswa."
              />
              <SkillSlider
                id="mengaturEmosi"
                label="Mengatur emosi saat kesulitan"
                value={values.mengaturEmosi}
                onChange={(next) => form.setValue("mengaturEmosi", next)}
              />
              <Field
                label="Catatan sosial-emosional"
                htmlFor="socialNotes"
                error={form.formState.errors.socialNotes?.message}
              >
                <Textarea
                  id="socialNotes"
                  rows={3}
                  placeholder="Contoh: mudah terbentuk jika diberi tugas dengan instruksi singkat."
                  {...form.register("socialNotes")}
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold">Keterampilan motorik</p>
              <SkillSlider
                id="motorHalus"
                label="Motorik halus"
                value={values.motorHalus}
                onChange={(next) => form.setValue("motorHalus", next)}
                hint="Menentukan ukuran tombol dan memengaruhi pilihan interaksi susun gambar."
              />
              <SkillSlider
                id="motorKasar"
                label="Motorik kasar"
                value={values.motorKasar}
                onChange={(next) => form.setValue("motorKasar", next)}
              />
              <Field
                label="Catatan motorik"
                htmlFor="motorNotes"
                error={form.formState.errors.motorNotes?.message}
              >
                <Textarea
                  id="motorNotes"
                  rows={3}
                  placeholder="Contoh: kuat memegang alat tulis, perlu penyangga pada pergelangan tangan."
                  {...form.register("motorNotes")}
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 4 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <SkillSlider
              id="dressed"
              label="Berpakaian dan kemandirian diri"
              value={values.dressed}
              onChange={(next) => form.setValue("dressed", next)}
            />
            <SkillSlider
              id="makan"
              label="Makan dan minum mandiri"
              value={values.makan}
              onChange={(next) => form.setValue("makan", next)}
            />
            <SkillSlider
              id="menggunakanAlat"
              label="Menggunakan alat belajar"
              value={values.menggunakanAlat}
              onChange={(next) => form.setValue("menggunakanAlat", next)}
              hint="Termasuk memakai sakelar, keyboard, atau alat komunikasi."
            />
            <Field
              label="Catatan kemandirian"
              htmlFor="independenceNotes"
              error={form.formState.errors.independenceNotes?.message}
            >
              <Textarea
                id="independenceNotes"
                rows={3}
                placeholder="Contoh: masih dibantu saat memakai pulpen, sudah bisa minum sendiri dari botol."
                {...form.register("independenceNotes")}
              />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {step === 5 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/80">
              <CardContent className="space-y-5 pt-6">
                <FieldSet
                  legend="Preferensi belajar"
                  required
                  description="AI akan menata urutan penyajian materi berdasarkan preferensi ini."
                  error={form.formState.errors.preferences?.message}
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PREFERENCE_OPTIONS.map((option) => {
                      const checked = values.preferences.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          htmlFor={`pref-${option.value}`}
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors",
                            checked
                              ? "border-primary bg-accent/50"
                              : "border-border hover:bg-muted/60",
                          )}
                        >
                          <Checkbox
                            id={`pref-${option.value}`}
                            className="mt-0.5"
                            checked={checked}
                            onCheckedChange={(value) =>
                              form.setValue(
                                "preferences",
                                value === true
                                  ? [...values.preferences, option.value]
                                  : values.preferences.filter(
                                      (item) => item !== option.value,
                                    ),
                              )
                            }
                          />
                          <span>
                            <span className="block text-sm font-medium">
                              {option.label}
                            </span>
                            <span className="block text-xs leading-relaxed text-muted-foreground">
                              {option.hint}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </FieldSet>

                <FieldSet
                  legend="Bentuk interaksi yang dapat dilakukan siswa"
                  required
                  description="Hanya bentuk interaksi terpilih yang muncul di layar belajar."
                  error={form.formState.errors.interactions?.message}
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INTERACTION_VALUES.map((mode) => {
                      const checked = values.interactions.includes(mode);
                      return (
                        <label
                          key={mode}
                          htmlFor={`int-${mode}`}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                            checked
                              ? "border-primary bg-accent/50"
                              : "border-border hover:bg-muted/60",
                          )}
                        >
                          <Checkbox
                            id={`int-${mode}`}
                            checked={checked}
                            onCheckedChange={(value) =>
                              form.setValue(
                                "interactions",
                                value === true
                                  ? [...values.interactions, mode]
                                  : values.interactions.filter((item) => item !== mode),
                              )
                            }
                          />
                          <span className="text-sm font-medium">
                            {INTERACTION_LABELS[mode]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </FieldSet>

                <FieldSet
                  legend="Tampilan layar siswa"
                  description="Diterapkan langsung di halaman belajar siswa, termasuk ukuran teks dan kontras."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Ukuran teks" htmlFor="fontSize">
                      <Select
                        value={values.fontSize}
                        onValueChange={(value) =>
                          form.setValue("fontSize", value as StudentFormValues["fontSize"])
                        }
                      >
                        <SelectTrigger id="fontSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Besar (1.15x)</SelectItem>
                          <SelectItem value="medium">Sedang (1x)</SelectItem>
                          <SelectItem value="high">Besar sekali (1.3x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Kontras" htmlFor="contrastMode">
                      <Select
                        value={values.contrastMode}
                        onValueChange={(value) =>
                          form.setValue(
                            "contrastMode",
                            value as StudentFormValues["contrastMode"],
                          )
                        }
                      >
                        <SelectTrigger id="contrastMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONTRAST_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Kecepatan audio" htmlFor="audioSpeed">
                      <Select
                        value={values.audioSpeed}
                        onValueChange={(value) =>
                          form.setValue(
                            "audioSpeed",
                            value as StudentFormValues["audioSpeed"],
                          )
                        }
                      >
                        <SelectTrigger id="audioSpeed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AUDIO_SPEED_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Gaya navigasi" htmlFor="navStyle">
                      <Select
                        value={values.navStyle}
                        onValueChange={(value) =>
                          form.setValue(
                            "navStyle",
                            value as StudentFormValues["navStyle"],
                          )
                        }
                      >
                        <SelectTrigger id="navStyle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(NAV_STYLE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="audioEnabled" className="text-sm">
                        Aktifkan pembacaan audio
                      </Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Teks akan disorot per kata saat dibacakan.
                      </p>
                    </div>
                    <Switch
                      id="audioEnabled"
                      checked={values.audioEnabled}
                      onCheckedChange={(value) => form.setValue("audioEnabled", value)}
                    />
                  </div>
                </FieldSet>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit border-border/80 bg-muted/40">
            <CardContent className="space-y-4 pt-6">
              <p className="font-heading text-sm font-semibold">
                Catatan pemetaan untuk dokumen PPI
              </p>
              <TagInput
                id="strengths"
                label="Kekuatan siswa"
                hint="Dipakai otomatis saat menyusun tujuan pembelajaran PPI."
                placeholder="Contoh: lebih kuat konsentrasi"
                suggestions={[
                  "Kuat mengenali warna",
                  "Sabar saat menunggu",
                  "Senang bernyanyi",
                  "Tepat saat meniru",
                ]}
                value={values.strengths}
                onChange={(next) => form.setValue("strengths", next)}
              />
              <TagInput
                id="barriers"
                label="Kendala utama"
                hint="Menentukan layanan dan alat bantu yang perlu disiapkan."
                placeholder="Contoh: sulit fokus lebih dari 5 menit"
                suggestions={[
                  "Butuh benda nyata",
                  "Perlu konteks visual",
                  "Mudah lelah",
                  "Sulit membaca ruangan",
                ]}
                value={values.barriers}
                onChange={(next) => form.setValue("barriers", next)}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Kekuatan dan kendala ini ikut tersimpan di profil belajar dan
                dipakai ulang saat menyusun dokumen PPI.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <WizardFooter
        step={step}
        stepCount={STEPS.length}
        pending={pending}
        submitLabel={submitLabel}
        onBack={() => setStep((current) => Math.max(current - 1, 0))}
        onNext={goNext}
      />
    </form>
  );
}
