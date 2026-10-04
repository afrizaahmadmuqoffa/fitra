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
  const BahasaIcon = pillars[0].icon;
  const StrukturIcon = pillars[1].icon;
  const InteraksiIcon = pillars[2].icon;

  return (
    <section id="solusi" className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[42ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Fitra mengubah satu materi menjadi bahan belajar yang lebih sesuai.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Guru tidak perlu memulai dari banyak versi materi. Cukup unggah satu materi pelajaran. Fitra membaca isinya, melihat profil belajar siswa, lalu menyusun draft adaptasi.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <div className="flex h-full flex-col gap-6 rounded-2xl bg-background p-6 ring-1 ring-border md:flex-row md:items-center md:p-8">
              <div className="flex-1">
                <h3 className="font-heading text-2xl font-bold tracking-tight">
                  {pillars[0].title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {pillars[0].body}
                </p>
              </div>
              <div className="grid size-28 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground md:self-stretch">
                <BahasaIcon className="size-12" strokeWidth={1.5} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-5">
            <div className="flex h-full flex-col justify-center gap-6 rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
              <div className="flex items-start gap-3">
                <StrukturIcon className="size-8 shrink-0 text-primary-foreground/70" strokeWidth={1.5} />
                <h3 className="font-heading text-2xl font-bold tracking-tight">
                  {pillars[1].title}
                </h3>
              </div>
              <p className="leading-relaxed text-primary-foreground/85">
                {pillars[1].body}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-12">
            <div className="grid gap-6 rounded-2xl bg-background p-6 ring-1 ring-border md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-8">
              <div>
                <h3 className="font-heading text-2xl font-bold tracking-tight">
                  {pillars[2].title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {pillars[2].body}
                </p>
              </div>
              <div className="mx-auto grid aspect-video w-1/2 place-items-center rounded-xl bg-accent text-accent-foreground">
                <InteraksiIcon className="size-16" strokeWidth={1.5} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
