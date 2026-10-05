"use client";

import * as React from "react";
import { useTheme, useThemeMounted } from "@/components/theme-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  resetOnboardingAction,
  updateNotificationPreferencesAction,
  updateTeacherProfileAction,
} from "@/actions/auth";
import { jalankanAction } from "@/lib/action-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field } from "@/components/dashboard/field";
import { accountSchema, type AccountInput } from "@/lib/validation";
import {
  Compass,
  KeyRound,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import type { TeacherProfile } from "@/lib/dummy/types";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function SettingsForm({ teacher }: { teacher: TeacherProfile }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const themeMounted = useThemeMounted();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    teacher.preferences?.notificationsEnabled ?? true
  );
  const [restartingTour, setRestartingTour] = React.useState(false);
  const [password, setPassword] = React.useState({ current: "", next: "", confirm: "" });

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: teacher.fullName,
      email: teacher.email,
      schoolName: teacher.schoolName,
      city: teacher.city,
    },
  });

  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [savingPrefs, setSavingPrefs] = React.useState(false);

  async function onSubmit(values: AccountInput) {
    setSavingProfile(true);
    try {
      const result = await jalankanAction(() => updateTeacherProfileAction(values));

      if (!result.ok) {
        toast.error("Profil belum tersimpan", { description: result.message });
        return;
      }
      toast.success(result.message, {
        description:
          "Perubahan ini tampil pada kop dokumen PPI dan materi yang Anda terbitkan.",
      });
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      const result = await jalankanAction(() =>
        updateNotificationPreferencesAction({ notificationsEnabled })
      );

      if (!result.ok) {
        toast.error("Preferensi belum tersimpan", { description: result.message });
        return;
      }
      toast.success(result.message);
      router.refresh();
    } finally {
      setSavingPrefs(false);
    }
  }

  async function savePassword() {
    if (password.next.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter");
      return;
    }
    if (password.next !== password.confirm) {
      toast.error("Konfirmasi kata sandi tidak sama");
      return;
    }

    setSavingPassword(true);
    const result = await jalankanAction(() =>
      changePasswordAction({
        currentPassword: password.current,
        newPassword: password.next,
      }),
    );
    setSavingPassword(false);

    if (!result.ok) {
      toast.error("Kata sandi belum diganti", { description: result.message });
      return;
    }
    setPassword({ current: "", next: "", confirm: "" });
    toast.success(result.message, {
      description: "Gunakan kata sandi yang mudah Anda ingat tetapi sulit ditebak siswa.",
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border/80">
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={teacher.photoUrl} alt="" />
                <AvatarFallback className="text-lg">
                  {initialsOf(teacher.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading text-lg font-semibold">{teacher.fullName}</p>
                <p className="text-sm text-muted-foreground">{teacher.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mata pelajaran: {teacher.subjects.join(", ")}
                </p>
              </div>
            </div>

            <Separator />

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nama lengkap dan gelar"
                  htmlFor="fullName"
                  required
                  error={form.formState.errors.fullName?.message}
                >
                  <Input
                    id="fullName"
                    aria-invalid={Boolean(form.formState.errors.fullName)}
                    {...form.register("fullName")}
                  />
                </Field>
                <Field
                  label="Email"
                  htmlFor="email"
                  required
                  hint="Dipakai untuk masuk dan menerima pemberitahuan penting."
                  error={form.formState.errors.email?.message}
                >
                  <Input
                    id="email"
                    type="email"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register("email")}
                  />
                </Field>
                <Field
                  label="Nama sekolah"
                  htmlFor="schoolName"
                  required
                  hint="Dipakai pada kop dokumen PPI."
                  error={form.formState.errors.schoolName?.message}
                >
                  <Input
                    id="schoolName"
                    aria-invalid={Boolean(form.formState.errors.schoolName)}
                    {...form.register("schoolName")}
                  />
                </Field>
                <Field
                  label="Kota"
                  htmlFor="city"
                  error={form.formState.errors.city?.message}
                >
                  <Input id="city" {...form.register("city")} />
                </Field>
              </div>

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Menyimpan..." : "Simpan profil"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm font-semibold">Notifikasi</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pemberitahuan muncul di ikon lonceng pada header saat ada aktivitas siswa dan materi.
            </p>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Tampilkan notifikasi
              </Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={(value) => {
                  setNotificationsEnabled(value);
                  setTimeout(() => void savePreferences(), 0);
                }}
                disabled={savingPrefs}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold">Ganti kata sandi</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Kata sandi saat ini" htmlFor="current-password" required>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={password.current}
                  onChange={(event) =>
                    setPassword((current) => ({ ...current, current: event.target.value }))
                  }
                />
              </Field>
              <Field label="Kata sandi baru" htmlFor="next-password" required>
                <Input
                  id="next-password"
                  type="password"
                  autoComplete="new-password"
                  value={password.next}
                  onChange={(event) =>
                    setPassword((current) => ({ ...current, next: event.target.value }))
                  }
                />
              </Field>
              <Field label="Ulangi kata sandi baru" htmlFor="confirm-password" required>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={password.confirm}
                  onChange={(event) =>
                    setPassword((current) => ({ ...current, confirm: event.target.value }))
                  }
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Kata sandi minimal 8 karakter. Hindari memakai nama sekolah agar mudah
              ditebak.
            </p>
            <Button onClick={savePassword} disabled={savingPassword}>
              {savingPassword ? "Memperbarui..." : "Perbarui kata sandi"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm font-semibold">Tampilan aplikasi</p>
            <ToggleGroup
              type="single"
              value={
                !themeMounted
                  ? "sistem"
                  : resolvedTheme === "dark"
                    ? "gelap"
                    : resolvedTheme === "light"
                      ? "terang"
                      : "sistem"
              }
              onValueChange={(value) => {
                if (!value) return;
                setTheme(value === "gelap" ? "dark" : value === "terang" ? "light" : "system");
              }}
              variant="outline"
              className="w-full"
              aria-label="Pilih tema tampilan"
            >
              <ToggleGroupItem value="terang" className="flex-1">
                <Sun />
                Terang
              </ToggleGroupItem>
              <ToggleGroupItem value="gelap" className="flex-1">
                <Moon />
                Gelap
              </ToggleGroupItem>
              <ToggleGroupItem value="sistem" className="flex-1">
                <Monitor />
                Sistem
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Tampilan gelap dan terang sudah diuji memenuhi WCAG 2.2 AA. Pilihan
              Sistem mengikuti pengaturan perangkat Anda.
            </p>
          </CardContent>
        </Card>

<Card className="border-border/80">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Compass className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Tur panduan dashboard</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Tur enam langkah yang muncul saat pertama kali masuk. Jalankan
                  ulang kapan saja kalau lupa urutan kerjanya.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={restartingTour}
              onClick={async () => {
                setRestartingTour(true);
                try {
                  const result = await jalankanAction(resetOnboardingAction);
                  if (!result.ok) {
                    toast.error("Tur belum bisa dijalankan", {
                      description: result.message,
                    });
                    return;
                  }
                  toast.success("Tur akan muncul di Dasbor");
                  router.push("/dashboard");
                } finally {
                  setRestartingTour(false);
                }
              }}
            >
              <Compass className="size-4" aria-hidden="true" />
              Jalankan ulang tur
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}