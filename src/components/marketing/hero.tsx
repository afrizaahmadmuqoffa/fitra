import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotGrid } from "@/components/marketing/dot-grid";
import { IconConstellation } from "@/components/marketing/icon-constellation";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center">
      <DotGrid />
      <IconConstellation />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <div className="mx-auto max-w-[42rem] text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Platform adaptasi pembelajaran SLB
          </p>
          <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
            Satu Materi, Banyak Cara Belajar
          </h1>
          <p className="mt-6 mx-auto max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            Fitra mengubah satu materi pelajaran menjadi versi yang menyesuaikan
            kemampuan, media, dan cara interaksi setiap siswa SLB.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
              <Link href="/masuk">
                Daftar Gratis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 whitespace-nowrap">
              <Link href="/#cara-kerja">Lihat Cara Kerja</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}