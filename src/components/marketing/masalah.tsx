import { SlidersHorizontal, UserCheck, FileText } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { BlobShape } from "@/components/marketing/blob-shape";

const problems = [
  {
    title: "Satu materi, banyak penyesuaian",
    body: "Guru perlu menyesuaikan bahasa, jumlah informasi, media, instruksi, sampai cara siswa menjawab.",
    icon: SlidersHorizontal,
  },
  {
    title: "Profil siswa tidak berhenti pada jenis ketunaan",
    body: "Jenis hambatan yang sama belum tentu membutuhkan cara belajar yang sama. Kemampuan membaca, berhitung, motorik, komunikasi, preferensi belajar, dan aspek perkembangan lainnya ikut menentukan.",
    icon: UserCheck,
  },
  {
    title: "PPI membutuhkan gambaran siswa yang utuh",
    body: "Perencanaan pembelajaran individual perlu berangkat dari profil dan kebutuhan siswa, kemudian digunakan untuk menentukan tujuan, layanan, dan evaluasi pembelajaran.",
    icon: FileText, 
  },
];

export function Masalah() {
  return (
    <section id="masalah" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[46ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Di kelas yang sama, kebutuhan belajarnya tidak selalu sama.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Empat hal yang paling sering menghambat guru SLB di kelas.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="relative h-full rounded-lg border border-border p-5 transition-shadow hover:shadow-lg hover:shadow-primary/10">
                  <BlobShape
                    variant={(((i + 1) % 5) + 1).toString() as "1" | "2" | "3" | "4" | "5"}
                    className="absolute -top-8 -left-4 size-32 text-muted/20 -z-10"
                  />
                  <p className="font-mono text-sm text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <Icon className="mt-2 size-6 text-primary" aria-hidden />
                  <h3 className="mt-3 font-heading text-lg leading-snug font-semibold text-balance">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-14">
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            Siswa dengan Tunanetra (A), Tunarungu (B), Tunagrahita (C), dan
            Tunadaksa (D) memiliki kebutuhan belajar yang paling berbeda satu
            sama lain.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
