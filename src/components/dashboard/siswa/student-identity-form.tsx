"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldSet } from "@/components/dashboard/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISABILITY_LABELS } from "@/lib/constants";
import {
  studentIdentitySchema,
  type StudentIdentityInput,
} from "@/lib/validation";
import { updateStudentIdentityAction } from "@/actions/students";
import { jalankanAction } from "@/lib/action-helpers";
import type { Student } from "@/db/types";

type IdentityValues = z.input<typeof studentIdentitySchema>;

/** Ubah identitas dasar siswa: nama, usia, jenis kelamin, hambatan, catatan. */
export function StudentIdentityForm({
  student,
  onDone,
}: {
  student: Student;
  onDone: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  // Skema memakai z.coerce untuk usia, jadi bentuk masuk (nilai dari form)
  // dan bentuk keluar (setelah tervalidasi) berbeda.
  const form = useForm<IdentityValues, unknown, StudentIdentityInput>({
    resolver: zodResolver(studentIdentitySchema),
    mode: "onTouched",
    defaultValues: {
      fullName: student.fullName,
      nickname: student.nickname,
      age: student.age,
      gender: student.gender,
      disabilityType: student.disabilityType,
      notes: student.notes,
    },
  });
  const gender = useWatch({ control: form.control, name: "gender" });
  const disabilityType = useWatch({ control: form.control, name: "disabilityType" });

  async function onSubmit(input: StudentIdentityInput) {
    setPending(true);
    try {
      const result = await jalankanAction(() =>
        updateStudentIdentityAction({ studentId: student.id, values: input }),
      );
      if (!result.ok) {
        toast.error("Identitas belum diperbarui", { description: result.message });
        return;
      }
      toast.success(result.message, {
        description: "Halaman detail siswa sudah menampilkan data terbaru.",
      });
      onDone();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nama lengkap"
          htmlFor="edit-fullName"
          required
          error={form.formState.errors.fullName?.message}
        >
          <Input
            id="edit-fullName"
            aria-invalid={Boolean(form.formState.errors.fullName)}
            {...form.register("fullName")}
          />
        </Field>

        <Field
          label="Nama panggilan"
          htmlFor="edit-nickname"
          hint="Dipakai untuk menyapa siswa di layar belajar."
          error={form.formState.errors.nickname?.message}
        >
          <Input
            id="edit-nickname"
            aria-invalid={Boolean(form.formState.errors.nickname)}
            {...form.register("nickname")}
          />
        </Field>

        <Field
          label="Usia"
          htmlFor="edit-age"
          required
          error={form.formState.errors.age?.message}
        >
          <Input
            id="edit-age"
            type="number"
            min={3}
            max={25}
            aria-invalid={Boolean(form.formState.errors.age)}
            {...form.register("age", { valueAsNumber: true })}
          />
        </Field>

        <FieldSet legend="Jenis kelamin" required error={form.formState.errors.gender?.message}>
          <RadioGroup
            value={gender}
            onValueChange={(value) =>
              form.setValue("gender", value as StudentIdentityInput["gender"], {
                shouldValidate: true,
              })
            }
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="L" id="edit-gender-L" />
              <Label htmlFor="edit-gender-L">Laki-laki</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="P" id="edit-gender-P" />
              <Label htmlFor="edit-gender-P">Perempuan</Label>
            </div>
          </RadioGroup>
        </FieldSet>
      </div>

      <Field
        label="Jenis hambatan"
        required
        hint="Menentukan rekomendasi adaptasi materi dan tampilan layar siswa."
        error={form.formState.errors.disabilityType?.message}
      >
        <Select
          value={disabilityType}
          onValueChange={(value) =>
            form.setValue(
              "disabilityType",
              value as StudentIdentityInput["disabilityType"],
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger id="edit-disabilityType" aria-label="Jenis hambatan siswa">
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

      <Field
        label="Catatan guru"
        htmlFor="edit-notes"
        hint="Catatan singkat yang perlu diingat saat mengajar siswa ini."
        error={form.formState.errors.notes?.message}
      >
        <Input
          id="edit-notes"
          aria-invalid={Boolean(form.formState.errors.notes)}
          {...form.register("notes")}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}
          Simpan identitas
        </Button>
      </div>
    </form>
  );
}