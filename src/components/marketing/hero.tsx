import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="pt-14 pb-16 md:pt-20 md:pb-24">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="max-w-[34rem]">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Platform adaptasi pembelajaran
          </p>
          <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
            Satu Materi, Banyak Cara Belajar
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            Fitra mengubah satu materi pelajaran menjadi versi yang menyesuaikan
            kemampuan, media, dan cara interaksi setiap siswa SLB.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
              <Link href="/masuk">
                Daftar Gratis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 whitespace-nowrap">
              <Link href="/panduan">Lihat Cara Kerja</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border bg-muted shadow-[0_24px_60px_-32px_oklch(0.412_0.062_178/0.55)]">
            <Image
              src="https://picsum.photos/seed/fitra-guru-mendampingi-siswa-kelas/1200/900"
              alt="Guru mendampingi siswa di kelas SLB sambil membuka materi di laptop"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div>
              <dt className="text-sm text-muted-foreground">Siswa dilayani</dt>
              <dd className="mt-1 font-heading text-2xl font-bold">8</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Materi diadaptasi</dt>
              <dd className="mt-1 font-heading text-2xl font-bold">7</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Kelas aktif</dt>
              <dd className="mt-1 font-heading text-2xl font-bold">3</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function HeroProofStrip() {
  const items = [
    { icon: Users, label: "Profil belajar per siswa" },
    { icon: Sparkles, label: "Adaptasi ditulis AI, disetujui guru" },
    { icon: BookOpen, label: "QR access, tanpa kata sandi" },
  ];

  return (
    <section className="border-y bg-muted/40">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-10 gap-y-4 px-4 py-6 md:px-8">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <p key={item.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon className="size-4 text-primary" aria-hidden />
              {item.label}
            </p>
          );
        })}
      </div>
    </section>
  );
}