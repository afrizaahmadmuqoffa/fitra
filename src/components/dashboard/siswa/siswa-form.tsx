"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Field, FieldSet } from "@/components/dashboard/field";
import { WizardProgress, type WizardStep } from "@/components/dashboard/wizard";
import {
  AUDIO_SPEED_LABELS,
  CONTRAST_LABELS,
  DISABILITY_LABELS,
  INTERACTION_LABELS,
  LEVEL_LABELS,
  NAV_STYLE_LABELS,
} from "@/lib/constants";
import { disabilityTypeSchema, skillLevelSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import type { ClassRoom } from "@/lib/dummy/types";

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama terlalu panjang"),
  nickname: z.string().max(24).optional().or(z.literal("")),
  age: z
    .number({ error: "Isi usia siswa" })
    .int()
    .min(3, "Usia minimal 3 tahun")
    .max(25, "Usia maksimal 25 tahun"),
  gender: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  disabilityType: disabilityTypeSchema,
  classIds: z.array(z.string()),
  notes: z.string().max(400).optional().or(z.literal("")),
  academicLevel: skillLevelSchema,
  preferences: z
    .array(z.enum(["visual", "audio", "kinestetik"]))
    .min(1, "Pilih minimal satu preferensi belajar"),
  interactions: z
    .array(z.enum(["touch", "speech", "keyboard", "switch", "drag"]))
    .min(1, "Pilih minimal satu bentuk interaksi"),
  fontSize: skillLevelSchema,
  contrastMode: z.enum(["normal", "high"]),
  audioEnabled: z.boolean(),
  audioSpeed: z.enum(["slow", "normal", "fast"]),
  navStyle: z.enum(["step", "scroll", "tap"]),
});

type FormValues = z.infer<typeof formSchema>;

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
    id: "profil",
    title: "Pemetaan Awal",
    description: "Tingkat kemampuan, cara belajar, dan interaksi.",
  },
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["fullName", "nickname", "age", "gender", "disabilityType"],
  ["classIds", "notes"],
  [
    "academicLevel",
    "preferences",
    "interactions",
    "fontSize",
    "contrastMode",
    "audioEnabled",
    "audioSpeed",
    "navStyle",
  ],
];

const PREFERENCE_OPTIONS: { value: "visual" | "audio" | "kinestetik"; label: string; hint: string }[] = [
  { value: "visual", label: "Visual", hint: "Lebih mudah dengan gambar, warna, dandiagram." },
  { value: "audio", label: "Audio", hint: "Lebih mudah dengan penjelasan yang dibacakan." },
  { value: "kinestetik", label: "Kinestetik", hint: "Lebih mudah dengan gerakan dan peragaan." },
];

const INTERACTION_VALUES = ["touch", "speech", "keyboard", "switch", "drag"] as const;

export function SiswaForm({ classes }: { classes: ClassRoom[] }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      nickname: "",
      age: 9,
      gender: "L",
      disabilityType: "tunagrahita",
      classIds: [],
      notes: "",
      academicLevel: "medium",
      preferences: ["visual", "audio"],
      interactions: ["touch"],
      fontSize: "medium",
      contrastMode: "normal",
      audioEnabled: true,
      audioSpeed: "normal",
      navStyle: "step",
    },
  });

  const identity = useWatch({ control: form.control }) as FormValues;

  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) {
      toast.error("Periksa kembali isian pada langkah ini");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(values: FormValues) {
    const kelas = classes
      .filter((c) => values.classIds.includes(c.id))
      .map((c) => c.name);
    toast.success(`${values.fullName} berhasil ditambahkan`, {
      description:
        kelas.length > 0
          ? `Bergabung ke ${kelas.join(", ")}. Profil awal siap sebagai bahan adaptasi AI.`
          : "Profil awal siap sebagai bahan adaptasi AI. Tambahkan siswa ke kelas agar bisa mendapat akses QR.",
    });
    router.push("/dashboard/siswa");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  value={identity.gender}
                  onValueChange={(value) =>
                    form.setValue("gender", value as FormValues["gender"], {
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
                value={identity.disabilityType}
                onValueChange={(value) =>
                  form.setValue(
                    "disabilityType",
                    value as FormValues["disabilityType"],
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
              <ul className="grid gap-2 sm:grid-cols-2">
                {classes.map((item) => {
                  const checked = identity.classIds.includes(item.id);
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
                            const next = value === true
                              ? [...identity.classIds, item.id]
                              : identity.classIds.filter((id) => id !== item.id);
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
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/80">
              <CardContent className="space-y-5 pt-6">
                <FieldSet
                  legend="Tingkat kemampuan akademik"
                  description="Gunakan slider di editor profil lengkap untuk rincian membaca, menulis, dan berhitung."
                  required
                >
                  <RadioGroup
                    value={identity.academicLevel}
                    onValueChange={(value) =>
                      form.setValue(
                        "academicLevel",
                        value as FormValues["academicLevel"],
                      )
                    }
                    className="grid gap-2"
                  >
                    {(["low", "medium", "high"] as const).map((level) => (
                      <label
                        key={level}
                        htmlFor={`level-${level}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                          identity.academicLevel === level
                            ? "border-primary bg-accent/50"
                            : "border-border hover:bg-muted/60",
                        )}
                      >
                        <RadioGroupItem value={level} id={`level-${level}`} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-medium">{LEVEL_LABELS[level]}</span>
                          <span className="block text-xs text-muted-foreground">
                            {level === "low"
                              ? "Materi perlu dipecah kecil dan selalu butuh pendampingan."
                              : level === "medium"
                                ? "Materi perlu penyederhanaan ringan dan latihan berulang."
                                : "Materi bisa diberikan dengan tantangan ringan."}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </FieldSet>

                <FieldSet
                  legend="Preferensi belajar"
                  required
                  error={form.formState.errors.preferences?.message}
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PREFERENCE_OPTIONS.map((option) => {
                      const checked = identity.preferences.includes(option.value);
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
                            onCheckedChange={(value) => {
                              const next =
                                value === true
                                  ? [...identity.preferences, option.value]
                                  : identity.preferences.filter(
                                      (item) => item !== option.value,
                                    );
                              form.setValue(
                                "preferences",
                                next as FormValues["preferences"],
                                { shouldValidate: true },
                              );
                            }}
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
                  legend="Bentuk interaksi yang dapat dilakukan"
                  required
                  error={form.formState.errors.interactions?.message}
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INTERACTION_VALUES.map((mode) => {
                      const checked = identity.interactions.includes(mode);
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
                            onCheckedChange={(value) => {
                              const next =
                                value === true
                                  ? [...identity.interactions, mode]
                                  : identity.interactions.filter((item) => item !== mode);
                              form.setValue(
                                "interactions",
                                next as FormValues["interactions"],
                                { shouldValidate: true },
                              );
                            }}
                          />
                          <span className="text-sm font-medium">
                            {INTERACTION_LABELS[mode]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </FieldSet>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="space-y-5 pt-6">
                <FieldSet
                  legend="Preferensi tampilan layar siswa"
                  description="Pengaturan ini dipakai antarmuka siswa di /belajar dan bisa diubah guru kapan saja."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Ukuran teks" htmlFor="fontSize">
                      <Select
                        value={identity.fontSize}
                        onValueChange={(value) =>
                          form.setValue("fontSize", value as FormValues["fontSize"])
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
                        value={identity.contrastMode}
                        onValueChange={(value) =>
                          form.setValue(
                            "contrastMode",
                            value as FormValues["contrastMode"],
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
                        value={identity.audioSpeed}
                        onValueChange={(value) =>
                          form.setValue(
                            "audioSpeed",
                            value as FormValues["audioSpeed"],
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
                        value={identity.navStyle}
                        onValueChange={(value) =>
                          form.setValue("navStyle", value as FormValues["navStyle"])
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
                        Materi otomatis dibacakan dengan sorotan per kata.
                      </p>
                    </div>
                    <Switch
                      id="audioEnabled"
                      checked={identity.audioEnabled}
                      onCheckedChange={(value) => form.setValue("audioEnabled", value)}
                    />
                  </div>
                </FieldSet>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit border-border/80 bg-muted/40">
            <CardContent className="space-y-3 pt-6">
              <p className="font-heading text-sm font-semibold">Ringkasan yang akan disimpan</p>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Nama</dt>
                  <dd className="font-medium">{identity.fullName || "Belum diisi"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Jenis hambatan</dt>
                  <dd className="font-medium">
                    {DISABILITY_LABELS[identity.disabilityType]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Kelas</dt>
                  <dd className="font-medium">
                    {identity.classIds.length
                      ? classes
                          .filter((c) => identity.classIds.includes(c.id))
                          .map((c) => c.name)
                          .join(", ")
                      : "Belum ada kelas"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Bentuk interaksi</dt>
                  <dd className="font-medium">
                    {identity.interactions.length
                      ? identity.interactions
                          .map((mode) => INTERACTION_LABELS[mode])
                          .join(", ")
                      : "Belum dipilih"}
                  </dd>
                </div>
              </dl>
              <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                Rincian kemampuan membaca, menulis, berhitung, sosial-emosional,
                motorik, dan kemandirian bisa Anda lengkapi nanti di editor Profil
                Belajar. Materi hanya boleh diadaptasi setelah profil cukup terisi.
              </p>
              <Button variant="link" size="sm" asChild className="h-auto px-0">
                <Link href="/panduan#peta-profil">Baca panduan pemetaan profil</Link>
              </Button>
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
          <Button type="submit">
            <Save />
            Simpan siswa
          </Button>
        )}
      </div>
    </form>
  );
}