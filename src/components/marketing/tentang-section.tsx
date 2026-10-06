import { Users, ShieldCheck, Eye } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const values = [
  {
    title: "Berangkat dari profil siswa",
    body: "Adaptasi dimulai dari kemampuan, kebutuhan, dan cara interaksi yang relevan bagi masing-masing siswa.",
    icon: Users,
  },
  {
    title: "Tujuan pembelajaran tetap terjaga",
    body: "Fitra menyesuaikan cara penyajian dan interaksi tanpa mengubah tujuan pembelajaran serta informasi inti materi.",
    icon: ShieldCheck,
  },
  {
    title: "Guru tetap memegang kendali",
    body: "Setiap draft dapat direview, diedit, diregenerasi, dan disetujui sebelum diterbitkan untuk siswa.",
    icon: Eye,
  },
];

export function TentangSection() {
  return (
    <section className="section alt" id="tentang">
      <div className="preview-container mx-auto grid gap-6 px-4 md:grid-cols-2 md:px-8 md:items-stretch">
        <div className="about-main reveal rounded-[26px] bg-[#33635a] p-9 text-white">
          <div className="section-kicker mb-3 text-[#bfe9d9]">Tentang Fitra</div>
          <h2 className="text-[clamp(32px,4vw,48px)] font-heading tracking-[-0.04em] leading-[1.04]">
            Pembelajaran adaptif, dengan guru tetap di kursi pengemudi.
          </h2>
          <p className="mt-4 max-w-[560px] text-[15px] leading-[1.8] text-[#dcece7]">
            Fitra adalah platform berbasis AI untuk membantu guru Sekolah Luar Biasa mengadaptasi satu materi pelajaran ke
            beragam kebutuhan belajar individual. Sistem membantu menyusun draf, bukan menggantikan penilaian profesional
            guru.
          </p>
        </div>
        <div className="about-side grid gap-4 stagger">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <Reveal key={value.title} delay={i * 0.05}>
                <article className="principle rounded-[22px] border border-border bg-card p-6">
                  <h3 className="font-heading text-[16px] font-bold tracking-[-0.02em]">{value.title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.7] text-muted-foreground">{value.body}</p>
                </article>
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