import { Reveal } from "@/components/marketing/reveal";

const problems = [
  {
    title: "Satu materi, banyak penyesuaian",
    body: "Guru perlu menyesuaikan bahasa, jumlah informasi, media, instruksi, sampai cara siswa menjawab.",
  },
  {
    title: "Profil siswa tidak berhenti pada jenis ketunaan",
    body: "Jenis hambatan yang sama belum tentu membutuhkan cara belajar yang sama. Kemampuan membaca, berhitung, motorik, komunikasi, preferensi belajar, dan aspek perkembangan lainnya ikut menentukan.",
  },
  {
    title: "PPI membutuhkan gambaran siswa yang utuh",
    body: "Perencanaan pembelajaran individual perlu berangkat dari profil dan kebutuhan siswa, kemudian digunakan untuk menentukan tujuan, layanan, dan evaluasi pembelajaran.",
  },
];

export function Masalah() {
  return (
    <section className="section alt" id="masalah">
      <div className="preview-container mx-auto px-4 md:px-8">
        <div className="section-head reveal">
          <div className="section-kicker">Tantangan di kelas</div>
          <h2>Di kelas yang sama, kebutuhan belajarnya tidak selalu sama.</h2>
          <p>Tiga hal yang membuat guru SLB perlu melakukan banyak penyesuaian sebelum satu materi benar-benar siap digunakan.</p>
        </div>
        <div className="problem-grid grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          {problems.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.05} className="h-full">
              <article
                className={`problem-card h-full rounded-[22px] border p-6 shadow-[0_10px_25px_rgba(51,99,90,0.04)] ${i === 0 ? "border-border bg-card" : ""} ${i === 1 ? "border-transparent bg-[#d9f3e9] dark:bg-[rgba(51,99,90,0.2)]" : ""} ${i === 2 ? "border-transparent bg-[#ffe1d2] dark:bg-[rgba(120,60,40,0.2)]" : ""}`}
              >
                <span className="num text-[12px] font-black tracking-[0.06em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-7 font-heading text-[20px] leading-tight font-bold tracking-[-0.02em]">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
