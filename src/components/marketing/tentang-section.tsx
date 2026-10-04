import { Users, ShieldCheck, Eye } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { BlobShape } from "@/components/marketing/blob-shape";

const values = [
  {
    title: "Berbeda adalah kondisi normal, bukan masalah",
    body: "Setiap siswa SLB memiliki jalur belajar yang berbeda. Tugas kami adalah membuat jalur itu tersedia, bukan menyamakan semua orang.",
    icon: Users,
  },
  {
    title: "Guru adalah penentu",
    body: "AI menulis draf, tetapi keputusan belajar tetap milik guru. Tidak ada materi yang sampai ke siswa tanpa disetujui manusia.",
    icon: ShieldCheck,
  },
  {
    title: "Aksesibilitas bukan tambahan",
    body: "Ukuran teks, kontras, audio, dan cara menjawab dibangun sejak awal, bukan ditambahkan setelah produk selesai.",
    icon: Eye,
  },
];

export function TentangSection() {
  return (
    <section id="tentang" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[42ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Tiga hal yang kami pegang
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <Reveal key={value.title} delay={i * 0.05}>
                <div className="relative border-t-2 border-border pt-5">
                  <BlobShape
                    variant={(((i + 1) % 5) + 1).toString() as "1" | "2" | "3" | "4" | "5"}
                    className="absolute -top-8 left-0 size-32 text-muted/10 -z-10"
                  />
                  <Icon className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-balance">
                    {value.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {value.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
