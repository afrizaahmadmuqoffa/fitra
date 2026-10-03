"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Field, FieldSet } from "@/components/dashboard/field";
import { cn } from "@/lib/utils";
import {
  materialUploadSchema,
  type MaterialUploadInput,
} from "@/lib/validation";
import {
  CircleAlert,
  ClipboardType,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import type { ClassRoom, Student } from "@/lib/dummy/types";

const MAX_SIZE = 20 * 1024 * 1024;
const MAX_TEXT = 20000;
const ALLOWED = [".pdf", ".docx", ".txt"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} byte`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SUBJECT_OPTIONS = [
  "Matematika",
  "Bahasa Indonesia",
  "IPA",
  "PKn",
  "Pendidikan Agama",
  "Persiapan Kemandirian",
  "Seni Budaya",
];

export function MateriUploadForm({
  classes,
  studentsByClass,
}: {
  classes: ClassRoom[];
  studentsByClass: Record<string, Student[]>;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"file" | "teks">("file");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<MaterialUploadInput>({
    resolver: zodResolver(materialUploadSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      subject: "",
      classId: "",
      sourceType: "pdf",
      sourceText: "",
    },
  });

  const classId = useWatch({ control: form.control, name: "classId" }) ?? "";
  const sourceText = useWatch({ control: form.control, name: "sourceText" }) ?? "";
  const subject = useWatch({ control: form.control, name: "subject" }) ?? "";
  const targetStudents = studentsByClass[classId] ?? [];

  function acceptFile(next: File | undefined) {
    if (!next) return;
    const ext = `.${next.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ALLOWED.includes(ext)) {
      setFileError("Format file harus PDF, DOCX, atau TXT");
      setFile(null);
      return;
    }
    if (next.size > MAX_SIZE) {
      setFileError("Ukuran file maksimal 20 MB");
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(next);
    const sourceType = ext === ".pdf" ? "pdf" : ext === ".docx" ? "docx" : "text";
    form.setValue("sourceType", sourceType);
    if (!form.getValues("title")) {
      form.setValue(
        "title",
        next.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      );
    }
  }

  async function onSubmit(values: MaterialUploadInput) {
    if (mode === "file" && !file) {
      setFileError("Pilih file terlebih dahulu");
      return;
    }
    if (mode === "teks" && (values.sourceText ?? "").trim().length < 20) {
      toast.error("Tempelkan teks materi minimal 20 karakter");
      return;
    }
    setRunning(true);
    // Simulasi proses analisis AI yang berjalan pada Tahap 1.
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setRunning(false);
    toast.success(`${values.title} tersimpan dan masuk antrean analisis AI`, {
      description:
        "Status materi berubah menjadi Diproses AI, lalu Siap Review saat struktur bab berhasil dibaca.",
    });
    router.push("/dashboard/materi");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => {
          if (value) setMode(value as "file" | "teks");
        }}
        variant="outline"
        aria-label="Pilih sumber materi"
        className="w-full sm:w-auto"
      >
        <ToggleGroupItem value="file">
          <FileUp />
          Unggah file
        </ToggleGroupItem>
        <ToggleGroupItem value="teks">
          <ClipboardType />
          Tempel teks
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "file" ? (
        <Card className="border-border/80">
          <CardContent className="pt-6">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                acceptFile(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragOver ? "border-primary bg-accent/40" : "border-border bg-muted/30",
              )}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Upload className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading text-base font-semibold">
                  Tarik file ke sini atau pilih dari perangkat
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Format PDF, DOCX, atau TXT. Ukuran maksimal 20 MB.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                <FileUp />
                Pilih file
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(event) => acceptFile(event.target.files?.[0])}
                aria-label="Pilih file materi"
              />
              {file ? (
                <p className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm">
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                  {file.name}
                  <span className="text-xs text-muted-foreground">
                    ({formatSize(file.size)})
                  </span>
                </p>
              ) : null}
              {fileError ? (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {fileError}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80">
          <CardContent className="space-y-3 pt-6">
            <Field
              label="Teks materi"
              htmlFor="sourceText"
              required
              hint="Tempelkan isi bab yang ingin diadaptasi. Sistem memecahnya menjadi bagian-bagian kecil secara otomatis."
            >
              <Textarea
                id="sourceText"
                rows={10}
                placeholder="Contoh: Angka dipakai untuk menghitung benda. Angka 1 berarti satu benda. Angka 2 berarti dua benda."
                aria-invalid={sourceText.length > MAX_TEXT}
                {...form.register("sourceText")}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Progress
                value={Math.min(100, Math.round((sourceText.length / MAX_TEXT) * 100))}
                className="flex-1"
                indicatorClassName={sourceText.length > MAX_TEXT ? "bg-destructive" : "bg-primary"}
                aria-label="Panjang teks materi"
              />
              <p
                className={cn(
                  "text-xs tabular-nums",
                  sourceText.length > MAX_TEXT ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {sourceText.length.toLocaleString("id-ID")} / {MAX_TEXT.toLocaleString("id-ID")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/80">
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Judul materi"
              htmlFor="title"
              required
              error={form.formState.errors.title?.message}
            >
              <Input
                id="title"
                placeholder="Contoh: Mengenal Angka 1 sampai 10"
                aria-invalid={Boolean(form.formState.errors.title)}
                {...form.register("title")}
              />
            </Field>

            <Field
              label="Mata pelajaran"
              htmlFor="subject"
              required
              error={form.formState.errors.subject?.message}
            >
              <Select
                value={subject}
                onValueChange={(value) => form.setValue("subject", value, { shouldValidate: true })}
              >
                <SelectTrigger id="subject" aria-label="Mata pelajaran">
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label="Kelas target"
            htmlFor="classId"
            required
            hint="Siswa di kelas ini yang akan mendapat versi adaptasi personal."
            error={form.formState.errors.classId?.message}
          >
            <Select
              value={classId}
              onValueChange={(value) => {
                form.setValue("classId", value, { shouldValidate: true });
                form.setValue("targetStudentIds", []);
              }}
            >
              <SelectTrigger id="classId" aria-label="Kelas target">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - {item.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {classId ? (
            <FieldSet
              legend="Siswa target"
              description="Kosongkan bila ingin membuat adaptasi untuk semua siswa di kelas ini."
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {targetStudents.map((student) => (
                  <li key={student.id}>
                    <label
                      htmlFor={`target-${student.id}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/60"
                    >
                      <Checkbox
                        id={`target-${student.id}`}
                        onCheckedChange={(value) => {
                          const current = form.getValues("targetStudentIds") ?? [];
                          form.setValue(
                            "targetStudentIds",
                            value === true
                              ? [...current, student.id]
                              : current.filter((id) => id !== student.id),
                          );
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {student.fullName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {student.nickname}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </FieldSet>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-muted/40">
        <CardContent className="flex items-start gap-3 pt-6">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Apa yang terjadi setelah disimpan?</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Materi berstatus Draft. Saat proses AI berjalan status menjadi Diproses
              AI, lalu Siap Review ketika struktur bab berhasil dibaca. Semua hasil
              adaptasi berstatus draft dan tidak terlihat siswa sebelum Anda
              menyetujuinya.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" className="gap-1.5">
              <CircleAlert className="size-4" aria-hidden="true" />
              Aturan unggahan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aturan unggahan materi</DialogTitle>
              <DialogDescription>Pastikan bahan ajar aman untuk siswa.</DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>Ukuran file maksimal 20 MB dengan format PDF, DOCX, atau TXT.</li>
              <li>Teks yang ditempel maksimal 20.000 karakter.</li>
              <li>Materi yang sudah terbit tidak berubah sampai Anda menerbitkannya kembali.</li>
              <li>Adaptasi hanya dibuat untuk siswa yang profil belajarnya sudah terisi.</li>
            </ul>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Saya mengerti
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/materi">Batal</Link>
          </Button>
          <Button type="submit" disabled={running}>
            {running ? (
              <>
                <Loader2 className="animate-spin" />
                Memproses
              </>
            ) : (
              <>
                <Sparkles />
                Simpan dan proses AI
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}