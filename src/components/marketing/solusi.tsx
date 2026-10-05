import { MessageSquareText, ListOrdered, Touchpad } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const pillars = [
  {
    title: "Bahasa",
    body: "Kalimat dan kosakata disesuaikan dengan kemampuan siswa.",
    icon: MessageSquareText,
  },
  {
    title: "Struktur",
    body: "Materi dapat dipecah menjadi langkah-langkah yang lebih mudah diikuti.",
    icon: ListOrdered,
  },
  {
    title: "Interaksi",
    body: "Bentuk latihan dan cara menjawab dapat disesuaikan, seperti memilih, menyentuh, berbicara, atau mengetik.",
    icon: Touchpad,
  },
];

export function Solusi() {
  return (
    <section id="solusi" className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-350 px-4 md:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Fitra mengubah satu materi menjadi bahan belajar yang lebih sesuai.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Guru cukup mengunggah satu materi pelajaran. Fitra membaca isinya,
            mempertimbangkan profil belajar siswa, lalu menyusun draf adaptasi.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <Reveal key={pillar.title} delay={index * 0.06}>
                <article className="flex h-full flex-col rounded-2xl bg-background p-6 ring-1 ring-border md:p-8">
                  <div className="mb-6 grid size-14 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading text-xl font-bold tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {pillar.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
