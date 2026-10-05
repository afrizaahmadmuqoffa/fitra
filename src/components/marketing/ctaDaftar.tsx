import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaDaftar() {
  return (
    <section className="border-t py-20 md:py-28">
      <div className="relative mx-auto flex max-w-350 flex-col items-start gap-6 px-4 md:px-8">
        <Reveal>
          <h2 className="max-w-[26ch] text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Mulai dengan kelas pertama Anda
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            Buat akun gratis, tambahkan siswa pertama, dan lihat bagaimana Fitra
            mengubah cara Anda mengajar.
          </p>
        </Reveal>
        <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
          <Link href="/masuk">
            Daftar Gratis
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden size-56 -translate-y-1/2 items-center justify-center md:flex">
          <div className="absolute inset-4 rotate-6 rounded-3xl bg-primary/5" />
          <div className="relative w-44 rounded-2xl border bg-background p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="h-2 w-20 rounded-full bg-foreground/15" />
                <div className="h-2 w-14 rounded-full bg-foreground/10" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/70 p-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-background text-primary">
                <GraduationCap className="size-4" />
              </div>
              <div className="h-2 w-16 rounded-full bg-foreground/10" />
              <Sparkles className="size-4 text-primary/70" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
