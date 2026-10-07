"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, RotateCcw, Sparkles } from "lucide-react";

export default function StudentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(23,53,47,.10)] backdrop-blur-xl sm:p-10">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#ffd8bf]/70 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-16 size-48 rounded-full bg-[#bfead4]/80 blur-2xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-xl text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-[#f5e7df] text-[#8a5444] shadow-sm">
            <div className="relative">
              <Sparkles className="size-10" aria-hidden="true" />
              <span className="absolute -right-2 -top-2 size-3 rounded-full bg-[#ffe9a6]" />
            </div>
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#33635a]/55">Ruang belajar sedang rehat</p>
          <h1 className="mt-2 font-heading text-3xl font-black tracking-[-0.04em] sm:text-5xl">Ups, halaman ini tersandung.</h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#17352f]/62 sm:text-lg">
            Tidak apa-apa. Coba buka lagi sekali. Kalau masih belum muncul, minta guru memindai ulang kartu QR milikmu.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} size="lg" className="min-h-[var(--spacing-student-tap)] rounded-2xl bg-[#33635a] px-6 font-bold text-white hover:bg-[#29574e] active:scale-[0.97]">
              <RotateCcw className="size-5" aria-hidden="true" />
              Muat ulang
            </Button>
            <Button variant="outline" size="lg" asChild className="min-h-[var(--spacing-student-tap)] rounded-2xl border-[#17352f]/10 bg-white/80 font-bold text-[#17352f] active:scale-[0.97]">
              <Link href="/">
                <Home className="size-5" aria-hidden="true" />
                Kembali ke awal
              </Link>
            </Button>
          </div>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#33635a] hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ke halaman Fitra
          </Link>
        </div>
      </div>
    </div>
  );
}
