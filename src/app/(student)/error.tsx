"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Error boundary area siswa. Bahasa tetap sederhana dan ramah anak, dengan
 * target sentuh besar sesuai WCAG 2.2 AA.
 */
export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-6">
      <Card className="border-2 border-destructive/40">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <CircleAlert className="size-7" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-2xl font-bold">Halaman ini gagal dibuka</h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Coba muat ulang sekali lagi. Kalau masih gagal, minta guru memindai ulang
            kartu QR milikmu.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={reset}
              className="min-h-[var(--spacing-student-tap)] sm:w-auto"
            >
              <RotateCcw />
              Muat ulang
            </Button>
            <Button
              variant="outline"
              asChild
              className="min-h-[var(--spacing-student-tap)] sm:w-auto"
            >
              <Link href="/">Kembali ke awal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}