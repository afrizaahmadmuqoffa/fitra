import { Users, ShieldCheck, Eye } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { BlobShape } from "@/components/marketing/blob-shape";

const values = [
  {
    title: "Kebutuhan belajar beragam",
    body: "Ada jarak antara materi yang tersedia dan kebutuhan belajar siswa yang tidak selalu sama.",
    icon: Users,
  },
  {
    title: "Adaptasi dibantu AI",
    body: "Fitra membantu memindahkan pekerjaan adaptasi materi yang berulang ke dalam alur kerja yang lebih ringan.",
    icon: ShieldCheck,
  },
  {
    title: "Lebih banyak ruang untuk guru",
    body: "Fitra bukan untuk menggantikan guru, tetapi untuk memberi guru lebih banyak ruang memperhatikan siswanya.",
    icon: Eye,
  },
];

export function TentangSection() {
  return (
    <section id="tentang" className="py-20 md:py-28">
      <div className="mx-auto max-w-350 px-4 md:px-8">
        <Reveal className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Tentang Fitra
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Membuat materi lebih mungkin cocok dengan siswanya.
          </h2>
          <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-muted-foreground">
            Kami membantu memperkecil jarak antara materi yang tersedia dan kebutuhan belajar
            siswa—dengan alur adaptasi yang bisa dibantu AI, tanpa menggantikan peran guru.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <Reveal key={value.title} delay={i * 0.05}>
                <div className="group relative h-full rounded-2xl border border-border bg-card/60 p-6 pt-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <BlobShape
                    variant={(((i + 1) % 5) + 1).toString() as "1" | "2" | "3" | "4" | "5"}
                    className="absolute -right-3 -top-7 size-32 text-muted/10 transition-transform duration-300 group-hover:rotate-6"
                  />
                  <div className="relative flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="relative mt-5 font-heading text-xl font-bold tracking-tight text-balance">
                    {value.title}
                  </h3>
                  <p className="relative mt-3 leading-relaxed text-muted-foreground">
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

// # TENTANG

// ## Fitra dibuat untuk satu pekerjaan yang sederhana: membuat materi lebih mungkin cocok dengan siswanya.

// Kami melihat ada jarak antara materi yang tersedia guru dan kebutuhan belajar siswa yang tidak selalu sama.

// Fitra mencoba memperkecil jarak itu dengan memindahkan pekerjaan adaptasi yang berulang ke dalam satu alur kerja yang bisa dibantu AI.

// Bukan untuk menggantikan guru.

// Untuk memberi guru lebih banyak ruang untuk memperhatikan siswanya.