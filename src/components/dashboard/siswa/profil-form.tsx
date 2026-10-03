"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveStudentProfileAction } from "@/actions/students";
import { jalankanAction } from "@/lib/action-helpers";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  AUDIO_SPEED_LABELS,
  CONTRAST_LABELS,
  INTERACTION_LABELS,
  LEVEL_LABELS,
  NAV_STYLE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import type { SkillLevel, StudentProfile } from "@/lib/dummy/types";

const LEVELS: SkillLevel[] = ["low", "medium", "high"];
const LEVEL_INDEX: Record<SkillLevel, number> = { low: 0, medium: 1, high: 2 };

const STEPS: WizardStep[] = [
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

type FormValues = {
  membaca: SkillLevel;
  menulis: SkillLevel;
  berhitung: SkillLevel;
  academicNotes: string;
  mengenaliOrang: SkillLevel;
  bekerjaSama: SkillLevel;
  mengaturEmosi: SkillLevel;
  socialNotes: string;
  motorHalus: SkillLevel;
  motorKasar: SkillLevel;
  motorNotes: string;
  dressed: SkillLevel;
  makan: SkillLevel;
  menggunakanAlat: SkillLevel;
  independenceNotes: string;
  preferences: string[];
  interactions: string[];
  fontSize: SkillLevel;
  contrastMode: "normal" | "high";
  audioEnabled: boolean;
  audioSpeed: "slow" | "normal" | "fast";
  navStyle: "step" | "scroll" | "tap";
  strengths: string[];
  barriers: string[];
};

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["membaca", "menulis", "berhitung", "academicNotes"],
  ["mengenaliOrang", "bekerjaSama", "mengaturEmosi", "socialNotes", "motorHalus", "motorKasar", "motorNotes"],
  ["dressed", "makan", "menggunakanAlat", "independenceNotes"],
  [
    "preferences",
    "interactions",
    "fontSize",
    "contrastMode",
    "audioEnabled",
    "audioSpeed",
    "navStyle",
  ],
];

const PREFERENCE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "visual", label: "Visual", hint: "Gambar besar, warna mencolok, diagram sederhana." },
  { value: "audio", label: "Audio", hint: "Penjelasan dibacakan dengan tempo lambat." },
  { value: "kinestetik", label: "Kinestetik", hint: "Latihan melibatkan gerakan dan benda nyata." },
];

const INTERACTION_OPTIONS = ["touch", "speech", "keyboard", "switch", "drag"] as const;

function defaultsFromProfile(profile: StudentProfile | null): FormValues {
  return {
    membaca: profile?.academicDetails.membaca ?? "medium",
    menulis: profile?.academicDetails.menulis ?? "medium",
    berhitung: profile?.academicDetails.berhitung ?? "medium",
    academicNotes: "",
    mengenaliOrang: profile?.socialEmotional.mengenaliOrang ?? "medium",
    bekerjaSama: profile?.socialEmotional.bekerjaSama ?? "medium",
    mengaturEmosi: profile?.socialEmotional.mengaturEmosi ?? "medium",
    socialNotes: profile?.socialEmotional.catatan ?? "",
    motorHalus: profile?.motorSkills.motorHalus ?? "medium",
    motorKasar: profile?.motorSkills.motorKasar ?? "medium",
    motorNotes: profile?.motorSkills.catatan ?? "",
    dressed: profile?.independence.dressed ?? "medium",
    makan: profile?.independence.makan ?? "medium",
    menggunakanAlat: profile?.independence.menggunakanAlat ?? "medium",
    independenceNotes: profile?.independence.catatan ?? "",
    preferences: profile
      ? (Object.entries(profile.learningPreferences)
          .filter(([, value]) => value)
          .map(([key]) => key) as string[])
      : ["visual", "audio"],
    interactions: profile
      ? (Object.entries(profile.interactionModes)
          .filter(([, value]) => value)
          .map(([key]) => key) as string[])
      : ["touch"],
    fontSize: profile?.uiTokens.fontSize ?? "medium",
    contrastMode: profile?.uiTokens.contrastMode ?? "normal",
    audioEnabled: profile?.uiTokens.audioEnabled ?? true,
    audioSpeed: profile?.uiTokens.audioSpeed ?? "normal",
    navStyle: profile?.uiTokens.navStyle ?? "step",
    strengths: [],
    barriers: [],
  };
}

function SkillSlider({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: SkillLevel;
  onChange: (next: SkillLevel) => void;
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

export function ProfilForm({
  studentId,
  profile,
}: {
  studentId: string;
  profile: StudentProfile | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const form = useForm<FormValues>({ mode: "onTouched", defaultValues: defaultsFromProfile(profile) });
  const values = useWatch({ control: form.control }) as FormValues;

  const filled = React.useMemo(() => {
    const required: (keyof FormValues)[] = [
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
    ];
    const done = required.filter((key) => Boolean(values[key])).length;
    return Math.round((done / required.length) * 100);
  }, [values]);

  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) {
      toast.error("Lengkapi dulu isian pada langkah ini");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(data: FormValues) {
    if (data.preferences.length === 0 || data.interactions.length === 0) {
      toast.error("Pilih minimal satu preferensi belajar dan satu bentuk interaksi");
      setStep(3);
      return;
    }
setPending(true);
    try {
      const result = await jalankanAction(() =>
        saveStudentProfileAction({ studentId, values: data }),
      );

      if (!result.ok) {
        toast.error("Profil belum tersimpan", { description: result.message });
        return;
      }

      toast.success(result.message, {
        description:
          "Materi yang pernah terbit ditandai perlu ditinjau ulang agar tetap sesuai profil terbaru.",
      });
      router.push(`/dashboard/siswa/${studentId}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-border/80 bg-muted/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-semibold">Kelengkapan pemetaan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Materi hanya boleh diproses AI setelah minimal kemampuan akademik dan
              bentuk interaksi terisi.
            </p>
          </div>
          <p className="font-heading text-2xl font-semibold tabular-nums">{filled}%</p>
        </CardContent>
      </Card>

      <WizardProgress steps={STEPS} current={step} />

      {step === 0 ? (
        <Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Geser setiap kemampuan sesuai kondisi siswa hari ini. Tidak ada
              nilai benar atau salah, ini bahan penyesuaian materi.
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
            >
              <Textarea
                id="academicNotes"
                rows={3}
                placeholder="Contoh: sudah mengenal huruf vokal, masih kesulitan untuk huruf berdesbrisasi."
                {...form.register("academicNotes")}
              />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
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
                {...(profile ? { hint: profile.socialEmotional.catatan } : {})}
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
              <Field label="Catatan motorik" htmlFor="motorNotes">
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

      {step === 2 ? (
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
            <Field label="Catatan kemandirian" htmlFor="independenceNotes">
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

      {step === 3 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/80">
              <CardContent className="space-y-5 pt-6">
                <FieldSet
                  legend="Preferensi belajar"
                  required
                  description="AI akan menata urutan penyajian materi berdasarkan preferensi ini."
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PREFERENCE_OPTIONS.map((option) => {
                      const checked = values.preferences.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          htmlFor={`prof-pref-${option.value}`}
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors",
                            checked ? "border-primary bg-accent/50" : "border-border hover:bg-muted/60",
                          )}
                        >
                          <Checkbox
                            id={`prof-pref-${option.value}`}
                            className="mt-0.5"
                            checked={checked}
                            onCheckedChange={(value) =>
                              form.setValue(
                                "preferences",
                                value === true
                                  ? [...values.preferences, option.value]
                                  : values.preferences.filter((item) => item !== option.value),
                              )
                            }
                          />
                          <span>
                            <span className="block text-sm font-medium">{option.label}</span>
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
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INTERACTION_OPTIONS.map((mode) => {
                      const checked = values.interactions.includes(mode);
                      return (
                        <label
                          key={mode}
                          htmlFor={`prof-int-${mode}`}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                            checked ? "border-primary bg-accent/50" : "border-border hover:bg-muted/60",
                          )}
                        >
                          <Checkbox
                            id={`prof-int-${mode}`}
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
                          <span className="text-sm font-medium">{INTERACTION_LABELS[mode]}</span>
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
                    <Field label="Ukuran teks" htmlFor="prof-fontSize">
                      <Select
                        value={values.fontSize}
                        onValueChange={(value) =>
                          form.setValue("fontSize", value as SkillLevel)
                        }
                      >
                        <SelectTrigger id="prof-fontSize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Besar (1.15x)</SelectItem>
                          <SelectItem value="medium">Sedang (1x)</SelectItem>
                          <SelectItem value="high">Besar sekali (1.3x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Kontras" htmlFor="prof-contrast">
                      <Select
                        value={values.contrastMode}
                        onValueChange={(value) =>
                          form.setValue(
                            "contrastMode",
                            value as FormValues["contrastMode"],
                          )
                        }
                      >
                        <SelectTrigger id="prof-contrast">
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
                    <Field label="Kecepatan audio" htmlFor="prof-audio">
                      <Select
                        value={values.audioSpeed}
                        onValueChange={(value) =>
                          form.setValue("audioSpeed", value as FormValues["audioSpeed"])
                        }
                      >
                        <SelectTrigger id="prof-audio">
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
                    <Field label="Gaya navigasi" htmlFor="prof-nav">
                      <Select
                        value={values.navStyle}
                        onValueChange={(value) =>
                          form.setValue("navStyle", value as FormValues["navStyle"])
                        }
                      >
                        <SelectTrigger id="prof-nav">
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
                      <Label htmlFor="prof-audioEnabled" className="text-sm">
                        Aktifkan pembacaan audio
                      </Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Teks akan disorot per kata saat dibacakan.
                      </p>
                    </div>
                    <Switch
                      id="prof-audioEnabled"
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
                placeholder="Contoh: ALEBIH kuat konsentrasi"
                suggestions={["Kuat mengenali warna", "Sabar saat menunggu", "Senang bernyanyi", "Tepat saat meniru"]}
                value={values.strengths}
                onChange={(next) => form.setValue("strengths", next)}
              />
              <TagInput
                id="barriers"
                label="Kendala utama"
                hint="Menentukan layanan dan alat bantu yang perlu disiapkan."
                placeholder="Contoh: sulit fokus lebih dari 5 menit"
                suggestions={["Butuh benda nyata", "Perlu konteks visual", "Mudah lelah", "Sulit membaca ruangan"]}
                value={values.barriers}
                onChange={(next) => form.setValue("barriers", next)}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0}
        >
          <ArrowLeft />
          Kembali
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Lanjut
            <ArrowRight />
          </Button>
        ) : (
<Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save />}
            Simpan profil
          </Button>
        )}
      </div>
    </form>
  );
}