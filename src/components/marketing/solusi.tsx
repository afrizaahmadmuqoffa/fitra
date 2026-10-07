import { MessageSquareText, ListOrdered, Touchpad } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const pillars = [
  {
    title: "Bahasa",
    body: "Kalimat dan kosakata disesuaikan dengan kemampuan siswa.",
    icon: MessageSquareText,
    iconColor: "mint",
  },
  {
    title: "Struktur",
    body: "Materi dapat dipecah menjadi langkah-langkah yang lebih mudah diikuti.",
    icon: ListOrdered,
    iconColor: "blue",
  },
  {
    title: "Interaksi",
    body: "Bentuk latihan dan cara menjawab dapat disesuaikan, seperti memilih, menyentuh, berbicara, atau mengetik.",
    icon: Touchpad,
    iconColor: "peach",
  },
];

export function Solusi() {
  return (
    <section className="section" id="solusi">
      <div className="preview-container mx-auto grid gap-[55px] px-4 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:items-center">
        <div className="solution-copy reveal">
          <div className="section-kicker">Cara Fitra membantu</div>
          <h2>Fitra mengubah satu materi menjadi bahan belajar yang lebih sesuai.</h2>
          <p className="mt-4 text-[16px] leading-[1.8] text-muted-foreground">
            Guru cukup mengunggah satu materi pelajaran. Fitra membaca isinya, mempertimbangkan profil belajar siswa, lalu
            menyusun draf adaptasi.
          </p>
          <div className="quote-card mt-6 rounded-[20px] bg-[#33635a] p-5 text-white shadow-[0_12px_32px_rgba(35,63,57,0.08)]">
            <strong className="font-heading text-[17px] leading-[1.35] block">
              Tujuan pembelajaran tetap. Cara menyampaikannya yang berubah.
            </strong>
          </div>
        </div>
        <div className="solution-points grid gap-3 stagger">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.06}>
              <article className="solution-item grid grid-cols-[48px_1fr] items-start gap-[14px] rounded-[20px] border border-border bg-card p-[18px] transition-transform duration-180 ease-[var(--ease-out)] hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(35,63,57,0.08)]">
                <div
                  className={`solution-icon grid size-[48px] place-items-center rounded-[15px] ${pillar.iconColor === "mint" ? "bg-[#d9f3e9] text-[#33635a] dark:bg-[rgba(51,99,90,0.25)] dark:text-[#9fe7c8]" : pillar.iconColor === "blue" ? "bg-[#d8eff5] text-[#315e6a] dark:bg-[rgba(40,80,95,0.25)] dark:text-[#7dcce0]" : "bg-[#ffe1d2] text-[#875b47] dark:bg-[rgba(120,60,40,0.25)] dark:text-[#e8a98a]"}`}
                >
                  <pillar.icon className="size-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-[16px] font-bold tracking-[-0.02em]">{pillar.title}</h3>
                  <p className="mt-1 text-[13px] leading-[1.65] text-muted-foreground">{pillar.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
