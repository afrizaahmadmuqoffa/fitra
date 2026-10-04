import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaDaftar() {
  return (
    <section className="border-t py-20 md:py-28">
      <div className="relative mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-4 md:px-8">
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
          <div className="absolute size-44 rotate-45 rounded-[2rem] border border-primary/15 bg-primary/[0.03]" />
          <div className="absolute size-32 rounded-full border border-primary/20" />
          <div className="absolute size-20 rounded-full bg-primary/10" />
          <div className="absolute right-2 top-4 size-4 rounded-full bg-primary/40" />
          <div className="absolute bottom-4 left-3 size-3 rounded-sm bg-primary/30" />
        </div>
      </div>
    </section>
  );
}
