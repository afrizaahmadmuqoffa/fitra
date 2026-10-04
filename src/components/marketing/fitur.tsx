import { ImagePlus, Sliders, UserCheck, QrCode, Wand2 } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const features = [
  {
    icon: Wand2,
    title: "Adaptasi Materi dengan AI",
    body: "Unggah materi lalu Fitra menyusun versi materi yang berbeda berdasarkan profil siswa tanpa mengubah tujuan pembelajaran dan informasi inti materi.",
    span: "md:col-span-6",
    tone: "bg-accent text-accent-foreground",
  },
  {
    icon: ImagePlus,
    title: "Visualisasi Materi",
    body: "Fitra mengidentifikasi bagian yang berpotensi terbantu oleh visual, lalu dapat membuat ilustrasi menggunakan AI.",
    span: "md:col-span-3",
    tone: "bg-muted",
  },
  {
    icon: UserCheck,
    title: "Review Guru",
    body: "AI menghasilkan draft lalu guru mereview materi hasil adaptasi AI, mengedit bagian tertentu, meminta regenerasi, kemudian menyetujui versi yang akan digunakan.",
    span: "md:col-span-3",
    tone: "bg-muted",
  },
  {
    icon: QrCode,
    title: "QR personal per siswa",
    body: "Guru membuat QR Code personal. Siswa cukup memindainya untuk masuk ke sesi belajar yang sudah disiapkan.",
    span: "md:col-span-4",
    tone: "bg-muted",
  },
  {
    icon: Sliders,
    title: "Antarmuka yang menyesuaikan",
    body: "Ukuran teks, kontras, audio, navigasi, dan cara menjawab dapat berubah mengikuti kebutuhan siswa.",
    span: "md:col-span-4",
    tone: "bg-muted",
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
            Fitra akan melakukan hal brilian berikut.
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
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}