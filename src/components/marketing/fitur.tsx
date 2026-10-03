import Link from "next/link";
import {
  ArrowRight,
  Ear,
  GaugeCircle,
  Layers,
  Printer,
  QrCode,
  Wand2,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const features = [
  {
    icon: Wand2,
    title: "Adaptasi per profil siswa",
    body: "Teks diperpendek, kalimat dipecah, dan kata diubah sesuai kemampuan baca tulis dan hitung setiap siswa.",
    span: "md:col-span-6",
    tone: "bg-accent text-accent-foreground",
  },
  {
    icon: Ear,
    title: "Narasi audio dengan penekanan kata",
    body: "Teks dibacakan per kata dan dapat diperlambat atau dipercepat sesuai kebutuhan siswa.",
    span: "md:col-span-3",
    tone: "bg-muted",
  },
  {
    icon: Layers,
    title: "Kurasi side by side",
    body: "Materi asli dan hasil adaptasi tampil berdampingan untuk disunting dan disetujui.",
    span: "md:col-span-3",
    tone: "bg-muted",
  },
  {
    icon: QrCode,
    title: "QR personal per siswa",
    body: "Token unik per siswa per kelas, bisa dinonaktifkan kapan saja.",
    span: "md:col-span-4",
    tone: "bg-muted",
  },
  {
    icon: GaugeCircle,
    title: "Antarmuka yang menyesuaikan",
    body: "Ukuran teks, kontras, gaya navigasi, dan kecepatan audio mengikuti profil.",
    span: "md:col-span-4",
    tone: "bg-muted",
  },
  {
    icon: Printer,
    title: "Dokumen PPI siap cetak",
    body: "Disusun dari profil dan progres, lalu diunduh sebagai PDF.",
    span: "md:col-span-4",
    tone: "bg-primary text-primary-foreground",
  },
];

export function Fitur() {
  return (
    <section id="fitur" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[42ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Yang Anda dapatkan
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Enam bagian yang menutup pekerjaan guru dari memetakan profil sampai
            menyusun PPI.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-12">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={i * 0.04} className={feature.span}>
                <article
                  className={`flex h-full flex-col rounded-2xl p-6 ${feature.tone}`}
                >
                  <Icon className="size-6" aria-hidden />
                  <h3 className="mt-5 font-heading text-xl font-bold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-relaxed opacity-85">{feature.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    verb: "Petakan",
    title: "Petakan profil belajar siswa",
    body: "Kemampuan akademik, sosial-emosional, motorik, kemandirian, preferensi belajar, dan bentuk interaksi yang bisa dilakukan siswa.",
    detail: "Enam langkah pemetaan dengan slider dan catatan singkat.",
  },
  {
    verb: "Unggah",
    title: "Unggah satu materi",
    body: "PDF, DOCX, atau teks yang ditempel langsung. AI menguraikan struktur, sub bagian, dan konsep kunci.",
    detail: "Ukuran maksimal 20 MB untuk berkas, 20.000 karakter untuk teks.",
  },
  {
    verb: "Adaptasi",
    title: "AI menulis versi per siswa",
    body: "Setiap siswa target mendapat versi sendiri dengan bahasa, media, audio, dan bentuk interaksi yang berbeda.",
    detail: "Semua hasil berstatus draft dan tidak terlihat oleh siswa.",
  },
  {
    verb: "Setujui",
    title: "Tinjau, sunting, setujui",
    body: "Bandingkan dengan materi asli, ubah bagian yang kurang pas, lalu setujui satu per satu.",
    detail: "Terbit hanya bila minimal satu adaptasi disetujui.",
  },
  {
    verb: "Bagikan",
    title: "Terbitkan dan bagikan QR",
    body: "Siswa memindai QR pribadi, membuka sesi yang sudah Anda terbitkan, dan belajar dengan antarmuka yang menyesuaikan profilnya.",
    detail: "Progres dan durasi belajar tersimpan otomatis.",
  },
];

export function CaraKerja() {
  return (
    <section id="cara-kerja" className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[42ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Dari satu materi ke materi yang berbeda untuk tiap siswa
          </h2>
        </Reveal>

        <ol className="mt-12 space-y-0">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.04}>
              <li className="grid gap-4 border-t border-border py-8 md:grid-cols-[7rem_1fr] md:gap-10">
                <p className="font-heading text-lg font-bold text-primary">
                  {step.verb}
                </p>
                <div>
                  <h3 className="font-heading text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[60ch] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground/80">
                    {step.detail}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-8">
          <Link
            href="/panduan"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Baca panduan lengkap untuk guru
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
