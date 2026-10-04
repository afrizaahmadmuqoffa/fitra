"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validation";

const PAGE_ERROR: Record<string, string> = {
  "kode-kosong": "Permintaan masuk dari Google tidak lengkap. Silakan coba lagi.",
  "gagal-tukar-kode": "Kode masuk dari Google sudah kedaluwarsa. Silakan coba lagi.",
};

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.3Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3a10 10 0 0 0 0 9.2L6.4 14Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4L6.4 10c.8-2.4 3-4.1 5.6-4.1Z"
      />
    </svg>
  );
}

function LoginForm({ nextPath }: { nextPath: string | null }) {


  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setFormError(null);

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setPending(false);
      const message =
        error.message === "Invalid login credentials"
          ? "Email atau kata sandi tidak cocok dengan data kami."
          : error.message;
      setFormError(message);
      toast.error("Gagal masuk", { description: message });
      return;
    }

    toast.success("Berhasil masuk", {
      description: `Selamat datang kembali, ${values.email}`,
    });
    router.replace(nextPath ?? "/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{formError}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@sekolah.sch.id"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Kata sandi</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Minimal 8 karakter"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <LogIn aria-hidden />
        )}
        Masuk
      </Button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [pending, setPending] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", schoolName: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true);
    setFormError(null);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          school_name: values.schoolName,
        },
      },
    });

    if (error) {
      setPending(false);
      const message =
        error.message === "User already registered"
          ? "Email ini sudah terdaftar. Silakan masuk dengan kata sandi Anda."
          : error.message;
      setFormError(message);
      toast.error("Gagal membuat akun", { description: message });
      return;
    }

    if (!data.session) {
      setPending(false);
      setFormError(
        "Akun berhasil dibuat, tetapi sesi belum aktif. Silakan masuk dengan email dan kata sandi Anda.",
      );
      toast.success("Akun berhasil dibuat", {
        description: "Silakan masuk untuk membuka dasbor.",
      });
      return;
    }

    toast.success("Akun berhasil dibuat", {
      description: `Selamat datang, ${values.fullName}.`,
    });
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{formError}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="fullName">Nama lengkap dan gelar</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Sri Wahyuni, S.Pd."
          aria-invalid={Boolean(form.formState.errors.fullName)}
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="schoolName">Nama sekolah</Label>
        <Input
          id="schoolName"
          autoComplete="organization"
          placeholder="SLB Negeri 1 Yogyakarta"
          aria-invalid={Boolean(form.formState.errors.schoolName)}
          {...form.register("schoolName")}
        />
        {form.formState.errors.schoolName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.schoolName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="nama@sekolah.sch.id"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Kata sandi</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <Mail aria-hidden />
        )}
        Buat akun
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Dengan membuat akun, Anda menyetujui penggunaan Fitra untuk keperluan
        pembelajaran inklusif di sekolah Anda.
      </p>
    </form>
  );
}

export function MasukClient({
  nextPath,
  errorCode,
}: {
  nextPath: string | null;
  errorCode: string | null;
}) {


  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [googlePending, setGooglePending] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const startGoogle = async () => {
    setGooglePending(true);
    setGoogleError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      nextPath ?? "/dashboard",
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setGooglePending(false);
      setGoogleError(error.message);
      toast.error("Gagal menghubungi Google", { description: error.message });
    }
  };

  const pageError = errorCode
    ? (PAGE_ERROR[errorCode] ?? "Proses masuk tidak dapat diselesaikan.")
    : null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Masuk ke Fitra
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Gunakan akun guru Anda. Siswa tidak perlu akun.
      </p>

      {pageError && (
        <Alert variant="destructive" className="mt-5">
          <AlertDescription className="text-sm">{pageError}</AlertDescription>
        </Alert>
      )}

      <Alert className="mt-5">
        <AlertDescription className="text-sm">
          Akun contoh untuk mencoba:{" "}
          <span className="font-medium">sri.wahyuni@slb1yogya.sch.id</span> dengan
          kata sandi <span className="font-medium">fitra2026</span>.
        </AlertDescription>
      </Alert>

      <div className="mt-6 grid gap-3">
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={startGoogle}
          disabled={googlePending}
        >
          {googlePending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <GoogleMark />
          )}
          Masuk dengan Google
        </Button>
        {googleError && (
          <p className="text-sm text-destructive">{googleError}</p>
        )}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        atau
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <Tabs defaultValue="masuk">
        <TabsList className="w-full">
          <TabsTrigger value="masuk" className="flex-1">
            Masuk
          </TabsTrigger>
          <TabsTrigger value="daftar" className="flex-1">
            Daftar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="masuk" className="mt-5">
          <LoginForm nextPath={nextPath} />
        </TabsContent>
        <TabsContent value="daftar" className="mt-5">
          <RegisterForm />
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/#panduan"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Lihat panduan terlebih dahulu
        </Link>
      </p>
    </div>
  );
}