import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Tentang Fitra",
  description:
    "Filosofi, misi, dan tim Fitra: platform yang membantu guru SLB mengubah satu materi menjadi banyak cara belajar.",
};

const values = [
  {
    title: "Berbeda adalah kondisi normal, bukan masalah",
    body: "Setiap siswa SLB memiliki jalur belajar yang berbeda. Tugas kami adalah membuat jalur itu tersedia, bukan menyamakan semua orang.",
  },
  {
    title: "Guru adalah penentu",
    body: "AI menulis draf, tetapi keputusan belajar tetap milik guru. Tidak ada materi yang sampai ke siswa tanpa disetujui manusia.",
  },
  {
    title: "Aksesibilitas bukan tambahan",
    body: "Ukuran teks, kontras, audio, dan cara menjawab dibangun sejak awal, bukan ditambahkan setelah produk selesai.",
  },
];

const team = [
  {
    name: "Sri Wahyuni, S.Pd.",
    role: "Guru SLB dan pemateri",
    body: "Dua belas tahun mengajar di SLB Negeri 1 Yogyakarta. Menulis materi untuk kelas kecil dengan perbedaan kemampuan yang sangat varied.",
    image: "https://picsum.photos/seed/fitra-tim-sri-wahyuni/480/480",
  },
  {
    name: "Agus Setiawan, S.Pd.",
    role: "Guru IPA SLB",
    body: "Mengembangkan lembar pengamatan IPA untuk siswa tunanetra dan tunadaksa di Bandung.",
    image: "https://picsum.photos/seed/fitra-tim-agus-setiawan/480/480",
  },
  {
    name: "Dewi Kartika",
    role: "Perancang aksesibilitas",
    body: "Bekerja pada ukuran teks, kontras, dan navigasi agar materi dipakai siswa dengan gangguan penglihatan dan motorik.",
    image: "https://picsum.photos/seed/fitra-tim-dewi-kartika/480/480",
  },
  {
    name: "Rendra Saputra",
    role: "Pengembang",
    body: "Membangun mesin adaptasi dan memastikan setiap hasil AI lolos pemeriksaan guru sebelum tampil.",
    image: "https://picsum.photos/seed/fitra-tim-rendra-saputra/480/480",
  },
];

export default function TentangPage() {
  return (
    <>
      <section className="pt-14 pb-16 md:pt-20 md:pb-20">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <Reveal className="max-w-[42ch]">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Tentang kami
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-5xl">
              Sistem belajar yang menganggap setiap siswa berbeda adalah hal
              wajar
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Fitra lahir dari pekerjaan guru SLB yang harus menyiapkan satu
              materi untuk siswa dengan kebutuhan yang sangat berbeda dalam
              waktu yang sama.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="misi" className="border-t py-20 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <Reveal className="max-w-[42ch]">
            <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Tiga hal yang kami pegang
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 0.05}>
                <div className="border-t-2 border-border pt-5">
                  <h3 className="font-heading text-xl font-bold tracking-tight text-balance">
                    {value.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {value.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="tim" className="bg-muted/40 py-20 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <Reveal className="max-w-[42ch]">
            <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Tim
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Guru SLB, perancang aksesibilitas, dan pengembang perangkat lunak.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((person, i) => (
              <Reveal key={person.name} delay={i * 0.04}>
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold tracking-tight">
                    {person.name}
                  </h3>
                  <p className="text-sm text-primary">{person.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {person.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-20 md:py-24">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-4 md:px-8">
          <Reveal>
            <h2 className="max-w-[26ch] text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Mulai dengan kelas pertama Anda
            </h2>
          </Reveal>
          <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
            <Link href="/masuk">Daftar Gratis</Link>
          </Button>
        </div>
      </section>
    </>
  );
}