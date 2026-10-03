"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthCallbackClient() {
  const router = useRouter();

  React.useEffect(() => {
    const timer = window.setTimeout(() => router.replace("/dashboard"), 1400);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="text-center">
      <Loader2 className="mx-auto size-8 animate-spin text-primary" aria-hidden />
      <h1 className="mt-6 font-heading text-xl font-bold tracking-tight">
        Menyelesaikan proses masuk
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Kami sedang menghubungkan akun Google Anda dengan ruang kerja guru.
        Anda akan langsung diarahkan ke dasbor.
      </p>
    </div>
  );
}