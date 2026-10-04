import { UserCog, FileCheck2, QrCode } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const pillars = [
  {
    title: "Profil belajar jadi dasar",
    body: "Anda memetakan kemampuan akademik, sosial-emosional, motorik, kemandirian, preferensi belajar, dan bentuk interaksi yang bisa dilakukan siswa. Hasil pemetaan itu yang dipakai AI sebagai pedoman.",
    icon: UserCog,
  },
  {
    title: "AI menulis, Anda memutuskan",
    body: "Setiap hasil adaptasi berstatus draft. Anda menyunting, meminta dibuat ulang, lalu menyetujui. Tidak ada satu pun materi yang sampai ke siswa tanpa persetujuan Anda.",
    icon: FileCheck2,
  },
  {
    title: "QR untuk siswa, tanpa login",
    body: "Setiap siswa punya QR pribadi. Memindai cukup untuk masuk. Antarmuka menyesuaikan ukuran teks, kontras, kecepatan audio, dan bentuk jawaban dari profil siswa.",
    icon: QrCode,
  },
];

export function Solusi() {
  return (
    <section id="solusi" className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[42ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Guru tetap pegang kendali penuh
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            AI mempercepat pekerjaan yang berulang. Keputusan mengenai materi
            tetap milik Anda.
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
              <div className="grid size-56 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground md:self-stretch">
                <UserCog className="size-24" strokeWidth={1.5} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-5">
            <div className="flex h-full flex-col justify-center gap-6 rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
              <div className="flex items-start gap-3">
                <FileCheck2 className="size-8 shrink-0 text-primary-foreground/70" strokeWidth={1.5} />
                <h3 className="font-heading text-2xl font-bold tracking-tight">
                  {pillars[1].title}
                </h3>
              </div>
              <p className="leading-relaxed text-primary-foreground/85">
                {pillars[1].body}
              </p>
              <p className="font-mono text-sm text-primary-foreground/70">
                draft &gt; edited &gt; approved
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
              <div className="grid aspect-16/9 place-items-center rounded-xl bg-accent text-accent-foreground">
                <QrCode className="size-32" strokeWidth={1.5} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
