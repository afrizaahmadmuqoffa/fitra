"use client";

import { ImagePlus, Sliders, UserCheck, QrCode, Wand2, ClipboardCheck } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Reveal } from "@/components/marketing/reveal";

const features = [
  {
    icon: Wand2,
    title: "Adaptasi Materi dengan AI",
    body: "Unggah materi lalu Fitra menyusun versi materi yang berbeda berdasarkan profil siswa tanpa mengubah tujuan pembelajaran dan informasi inti materi.",
    bgLight: "#d9f3e9",
    bgDark: "rgba(51,99,90,0.2)",
    border: "border-transparent",
  },
  {
    icon: ImagePlus,
    title: "Visualisasi Materi",
    body: "Fitra mengidentifikasi bagian yang berpotensi terbantu oleh visual, lalu dapat membuat ilustrasi menggunakan AI.",
    bgLight: "#e7ddff",
    bgDark: "rgba(80,50,130,0.25)",
    border: "border-transparent",
  },
  {
    icon: UserCheck,
    title: "Review Guru",
    body: "AI menghasilkan draft lalu guru mereview, mengedit bagian tertentu, meminta regenerasi, kemudian menyetujui versi yang akan digunakan.",
    bgLight: "#ffffff",
    bgDark: "",
    border: "border-border bg-card",
  },
  {
    icon: QrCode,
    title: "QR personal per siswa",
    body: "Guru membuat QR Code personal. Siswa cukup memindainya untuk masuk ke sesi belajar yang sudah disiapkan.",
    bgLight: "#ffe9a6",
    bgDark: "rgba(120,95,20,0.25)",
    border: "border-transparent",
  },
  {
    icon: Sliders,
    title: "Antarmuka yang menyesuaikan",
    body: "Ukuran teks, kontras, audio, navigasi, dan cara menjawab dapat berubah mengikuti kebutuhan siswa.",
    bgLight: "#d8eff5",
    bgDark: "rgba(40,80,95,0.22)",
    border: "border-transparent",
  },
  {
    icon: ClipboardCheck,
    title: "Satu materi, siap dikurasi",
    body: "Semua hasil adaptasi tetap hadir sebagai draf yang dapat diperiksa guru sebelum dipakai di kelas.",
    bgLight: "#ffd6e0",
    bgDark: "rgba(120,40,60,0.22)",
    border: "border-transparent",
  },
];

export function Fitur() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <section className="section alt" id="fitur">
      <div className="preview-container mx-auto px-4 md:px-8">
        <div className="section-head reveal">
          <div className="section-kicker">Fitur utama</div>
          <h2>Yang Anda dapatkan</h2>
          <p>Fitra membantu dari materi pertama sampai siswa siap belajar—tanpa mengambil alih peran guru.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const bgColor = feature.bgDark
              ? isDark ? feature.bgDark : feature.bgLight
              : undefined;
            return (
              <Reveal key={feature.title} delay={i * 0.04}>
                <article
                  className={`feature-card flex min-h-[235px] flex-col rounded-[23px] border p-6 transition-transform duration-180 ease-[var(--ease-out)] hover:-translate-y-[4px] hover:shadow-[0_12px_32px_rgba(35,63,57,0.08)] ${feature.border}`}
                  style={bgColor ? { backgroundColor: bgColor } : undefined}
                >
                  <div className="mb-[34px] grid size-[44px] place-items-center rounded-[14px] bg-white/20 text-[#33635a] dark:text-[#9fe7c8] dark:bg-white/10">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="font-heading text-[17px] font-bold tracking-[-0.02em]">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.7] text-muted-foreground">{feature.body}</p>
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
    verb: "Buat profil",
    title: "Buat profil siswa",
    body: "Masukkan kemampuan dan kebutuhan belajar siswa yang relevan.",
  },
  {
    verb: "Unggah",
    title: "Unggah materi",
    body: "Gunakan materi yang sudah dimiliki guru dalam format PDF, Word, atau teks.",
  },
  {
    verb: "Adaptasikan",
    title: "Adaptasikan materi",
    body: "Fitra menggunakan AI untuk menyesuaikan isi, struktur, media, dan interaksi berdasarkan profil siswa.",
  },
  {
    verb: "Periksa",
    title: "Periksa hasil adaptasi",
    body: "Guru melihat hasil adaptasi, mengedit jika diperlukan, dan menyetujui versi yang sudah sesuai.",
  },
  {
    verb: "Mulai belajar",
    title: "Siswa mulai belajar",
    body: "Materi yang telah disetujui diterbitkan ke siswa. Siswa memindai QR dan langsung masuk ke sesi belajar.",
  },
];

export function CaraKerja() {
  return (
    <section className="section" id="cara-kerja">
      <div className="preview-container mx-auto px-4 md:px-8">
        <div className="section-head reveal">
          <div className="section-kicker">Cara kerja</div>
          <h2>Dari satu materi ke materi yang berbeda untuk tiap siswa.</h2>
          <p>Alurnya singkat: profil, materi, adaptasi, review, lalu belajar.</p>
        </div>

        <div className="how-grid stagger grid gap-3 md:grid-cols-5">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.04}>
              <article
                className={`step relative min-h-[220px] rounded-[21px] border border-border bg-card p-5 md:p-5 ${i < steps.length - 1 ? "after:absolute after:-right-[17px] after:top-1/2 after:z-10 after:-translate-y-1/2 after:size-8 after:rounded-full after:border after:border-border after:bg-background after:text-muted-foreground after:content-['→'] after:text-[13px] after:font-bold after:hidden lg:after:flex lg:after:items-center lg:after:justify-center" : ""}`}
              >
                <span className="step-number grid size-8 place-items-center rounded-[11px] bg-[#33635a] text-[11px] font-black text-white">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-7 font-heading text-[17px] font-bold tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.65] text-muted-foreground">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="how-caption reveal mt-[21px] flex items-start gap-2 text-[12px] font-semibold text-muted-foreground">
          <span className="font-black text-[#33635a] dark:text-[#9fe7c8]">Catatan:</span> Fitra menempatkan AI sebagai pembantu penyusunan,
          sementara keputusan akhir tetap berada di tangan guru.
        </div>
      </div>
    </section>
  );
}