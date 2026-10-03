import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

const testimonials = [
  {
    quote:
      "Dulu saya butuh dua hari untuk menyiapkan satu materi angka untuk enam siswa. Sekarang saya butuh dua jam, dan setiap anak dapat versinya sendiri.",
    name: "Sri Wahyuni, S.Pd.",
    role: "Guru Matematika, SLB Negeri 1 Yogyakarta",
    image: "https://picsum.photos/seed/fitra-wawancara-guru-sri-wahyuni/320/320",
  },
  {
    quote:
      "Anak saya tuna rungu. Sekarang dia cukup memindai QR dan materinya langsung bertamilan besar dengan audio. Dia bisa belajar sendiri di rumah.",
    name: "Rahmawati",
    role: "Orang tua siswa Kelas IV",
    image: "https://picsum.photos/seed/fitra-wawancara-orang-tua-rahmawati/320/320",
  },
  {
    quote:
      "Bagian paling membantu justru saat menyusun PPI. Semua asesmen sudah terisi dari profil dan progres, saya tinggal melengkapinya.",
    name: "Agus Setiawan, S.Pd.",
    role: "Guru IPA, SLB Bina Insani Bandung",
    image: "https://picsum.photos/seed/fitra-wawancara-guru-agus-setiawan/320/320",
  },
];

export function Testimoni() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[42ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Kata guru dan orang tua
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <Reveal key={item.name} delay={i * 0.05}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <Quote className="size-6 text-primary" aria-hidden />
                <blockquote className="mt-5 flex-1 leading-relaxed text-foreground">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <Image
                    src={item.image}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{item.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {item.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaDaftar() {
  return (
    <section id="daftar" className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-20 md:px-8 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Mulai dari kelas pertama Anda
          </h2>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
            Gratis pada versi awal. Tanpa kartu kredit. Satu akun untuk satu
            ruang kerja guru.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
              <Link href="/masuk">
                Daftar Gratis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 whitespace-nowrap">
              <Link href="/panduan">Lihat Panduan</Link>
            </Button>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
            <Image
              src="https://picsum.photos/seed/fitra-kelas-slb-belajar-bersama/960/720"
              alt="Siswa SLB belajar bersama di kelas dengan pendampingan guru"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}