"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClassAction } from "@/actions/classes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/dashboard/field";
import { classSchema, type ClassInput } from "@/lib/validation";
import { Loader2, Plus } from "lucide-react";

const GRADE_OPTIONS = [
  "Kelas I",
  "Kelas II",
  "Kelas III",
  "Kelas IV",
  "Kelas V",
  "Kelas VI",
];

export function KelasToolbar({ grade }: { grade: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const form = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      subject: "",
      grade,
      room: "",
      description: "",
    },
  });
  const selectedGrade = useWatch({ control: form.control, name: "grade" });

  async function onSubmit(values: ClassInput) {
    setPending(true);
    const result = await createClassAction(values);
    setPending(false);

    if (!result.ok) {
      toast.error("Kelas belum tersimpan", { description: result.message });
      return;
    }

    toast.success(result.message, {
      description:
        "Siswa dan materi bisa ditambahkan dari halaman kelas ini. QR pribadi dibuat dari halaman kartu QR kelas.",
    });
    setOpen(false);
    form.reset();
    router.push("/dashboard/kelas");
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Buat kelas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat kelas baru</DialogTitle>
          <DialogDescription>
            Kelas menjadi target materi dan sumber token QR untuk para siswa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Nama kelas"
            htmlFor="class-name"
            required
            error={form.formState.errors.name?.message}
          >
            <Input
              id="class-name"
              placeholder="Contoh: Kelas VI-B"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mata pelajaran"
              htmlFor="class-subject"
              required
              error={form.formState.errors.subject?.message}
            >
              <Input
                id="class-subject"
                placeholder="Contoh: Matematika dan Bahasa Indonesia"
                aria-invalid={Boolean(form.formState.errors.subject)}
                {...form.register("subject")}
              />
            </Field>
            <Field
              label="Tingkat"
              htmlFor="class-grade"
              required
              error={form.formState.errors.grade?.message}
            >
              <div className="flex flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => form.setValue("grade", item, { shouldValidate: true })}
                    className={
                      "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
                      (selectedGrade === item
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50")
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field
            label="Ruang kelas"
            htmlFor="class-room"
            hint="Opsional. Bantu siswa menemukan kelas dengan cepat saat tiba di sekolah."
            error={form.formState.errors.room?.message}
          >
            <Input
              id="class-room"
              placeholder="Contoh: Ruang 6B, Lantai 3"
              {...form.register("room")}
            />
          </Field>

          <Field
            label="Catatan kelas"
            htmlFor="class-description"
            hint="Tuliskan fokus belajar kelas ini agar mudah diingat saat menyusun materi."
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="class-description"
              rows={3}
              placeholder="Contoh: Latihan membaca kalimat pendek dan pengenalan bilangan sampai 20."
              {...form.register("description")}
            />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Buat kelas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}