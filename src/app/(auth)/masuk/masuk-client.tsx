"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, LogIn, Mail, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function RegisterForm({ nextPath }: { nextPath: string | null }) {
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

    toast.success("Akun berhasil dibuat", {
      description: `Selamat datang, ${values.fullName}.`,
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

function DemoAccountPopover() {
  const [copiedEmail, setCopiedEmail] = React.useState(false);
  const [copiedPassword, setCopiedPassword] = React.useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText("sri.wahyuni@slb1yogya.sch.id");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText("fitra2026");
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        >
          Lihat akun demo
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-3">
          <p className="text-sm font-medium">Akun demo untuk mencoba Fitra:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-mono text-xs">sri.wahyuni@slb1yogya.sch.id</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={copyEmail}
              >
                {copiedEmail ? (
                  <Check className="size-3.5 text-green-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Password</p>
                <p className="font-mono text-xs">fitra2026</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={copyPassword}
              >
                {copiedPassword ? (
                  <Check className="size-3.5 text-green-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Data dalam akun demo akan direset secara berkala.
          </p>
        </div>
      </PopoverContent>
    </Popover>
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
  const [mode, setMode] = React.useState<"login" | "register">("login");

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
    <Card className="border-2 shadow-xl">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-bold tracking-tight">
          {mode === "login" ? "Masuk ke Fitra" : "Buat Akun Baru"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Gunakan akun guru Anda. Siswa tidak perlu akun."
            : "Daftar sebagai guru SLB untuk mulai menggunakan Fitra."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {pageError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{pageError}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {mode === "login" ? (
              <LoginForm nextPath={nextPath} />
            ) : (
              <RegisterForm nextPath={nextPath} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" aria-hidden />
          atau
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>

        <div className="space-y-3">
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

        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Daftar
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Masuk
                </button>
              </>
            )}
          </p>

          <div className="flex justify-center">
            <DemoAccountPopover />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}