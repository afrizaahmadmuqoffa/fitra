"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error.message.includes("Sesi guru tidak ditemukan")
      ? "Sesi Anda sudah berakhir. Silakan masuk kembali untuk melanjutkan."
      : "Data tidak dapat dimuat dari server. Periksa koneksi lalu coba lagi.";

  return (
    <div className="mx-auto w-full max-w-xl py-10">
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <CircleAlert className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-xl font-bold">Dasbor belum bisa dimuat</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">
              Kode {error.digest}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>
              <RotateCcw />
              Coba lagi
            </Button>
            <Button variant="outline" asChild>
              <Link href="/masuk">Masuk ulang</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}