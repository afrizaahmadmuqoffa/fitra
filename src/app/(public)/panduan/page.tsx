import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Panduan Penggunaan",
  description:
    "Panduan langkah demi langkah untuk guru SLB: memetakan profil siswa, mengunggah materi, meng adaptationsi, menyetujui, menerbitkan, dan membuat QR.",
};

const chapters = [
  {
    id: "peta-profil",
    title: "Memetakan profil belajar siswa",
    body: "Profil belajar adalah dasar dari seluruh materi yang Fitra buat. Buka menu Siswa, pilih salah satu siswa, lalu tekan Sunting Profil.",
    steps: [
      "Isi identitas dasar: nama, panggilan, usia, jenis kelamin, jenis hambatan, dan catatan.",
      "Petakan kemampuan akademik: membaca, menulis, berhitung.",
      "Petakan sosial-emosional: mengenali orang, bekerja sama, mengatur emosi.",
      "Petakan motorik halus dan motorik kasar.",
      "Petakan kemandirian: berpakaian, makan, menggunakan alat.",
      "Pilih preferensi belajar: visual, audio, atau kinestetik.",
      "Pilih bentuk interaksi yang bisa dilakukan siswa: sentuh, suara, ketik, sakelar tunggal, atau susun gambar.",
      "Atur tampilansiswa: ukuran teks, kontras, audio, kecepatan audio, dan gaya navigasi.",
    ],
    note: "Perubahan profil akan menandai materi yang pernah terbit sebagai Perlu Tinjau Ulang.",
  },
  {
    id: "unggah-materi",
    title: "Mengunggah dan menganalisis materi",
    body: "Buka menu Materi lalu tekan Tambah Materi. Pilih kelas target, lalu unggah berkas PDF atau DOCX, atau tempel teks materi secara langsung.",
    steps: [
      "Isi judul materi dan mata pelajaran.",
      "Pilih kelas target. Siswa di kelas itu yang akan mendapat adaptasi.",
      "Unggah berkas dengan ekstensi .pdf atau .docx, maksimal 20 MB.",
      "Atau tempel teks materi, maksimal 20.000 karakter.",
      "Kirim. Status materi berubah menjadi Diproses AI lalu Siap Review.",
    ],
    note: "Bila analisis gagal, status kembali ke Draft dan tombol coba lagi tersedia.",
  },
  {
    id: "kurasi",
    title: "Meninjau, menyunting, dan menyetujui adaptasi",
    body: "Ini bagian yang paling menentukan. Buka menu Materi, pilih salah satu materi, lalu masuk ke daftar adaptasi per siswa.",
    steps: [
      "Buka satu baris adaptasi. Materi asli tampil di kiri, hasil adaptasi di kanan.",
      "Baca setiap bagian. Perhatikan apakah kalimatnya sudah sesingkat mungkin.",
      "Periksa ilustrasi. Alt text wajib diisi agar siswa tunanetra mendapat deskripsi yang benar.",
      "Tekan Sunting untuk mengubah teks, atau Minta Buat Ulang untuk satu bagian tertentu.",
      "Tekan Setujui bila sudah sesuai. Status berubah menjadi Disetujui.",
    ],
    note: "Materi belum bisa terbit bila belum ada satu pun adaptasi yang disetujui.",
  },
  {
    id: "terbitkan",
    title: "Menerbitkan materi",
    body: "Kembali ke halaman detail materi dan tekan Terbitkan.",
    steps: [
      "Pastikan minimal satu adaptasi berstatus Disetujui.",
      "Tekan Terbitkan pada materi.",
      "Materi yang terbit hanya dapat diakses siswa yang adaptasinya sudah disetujui.",
    ],
    note: "Materi yang sudah terbit tetap bisa diubah. Setiap perubahanrecorded sebagai riwayat revisi.",
  },
  {
    id: "qr",
    title: "Membuat dan membagikan QR Code",
    body: "Buka menu Kelas, pilih kelas, lalu tekan QR Code.",
    steps: [
      "Setiap siswa punya QR pribadi dengan token unik.",
      "Cetak semua QR dalam satu lembar, atau unduh PNG per siswa.",
      "Tempelkan QR di meja siswa atau di sampul buku catatan.",
      "Siswa memindai dengan ponsel, tanpa perlu membuat akun.",
    ],
    note: "Satu siswa boleh berada di beberapa kelas dengan token yang berbeda. Token bisa dinonaktifkan kapan saja.",
  },
  {
    id: "progres-ppi",
    title: "Memantau progres dan menyusun PPI",
    body: "Menu Progres menampilkan partisipasi, waktu belajar, dan tingkat penyelesaian per siswa dan kelas. Klik nama siswa untuk melihat riwayat sesinya.",
    steps: [
      "Buka menu Progres dan atur rentang tanggal bila perlu.",
      "Klik nama siswa untuk melihat timeline sesi dan snapshot respons.",
      "Buka menu PPI lalu tekan Buat PPI.",
      "Pilih siswa. Tujuan dan layanan terisi otomatis dari profil dan progres.",
      "Lengkapi tujuan, layanan, jadwal, dan evaluasi.",
      "Simpan sebagai draft, lalu tekan Ekspor PDF bila sudah final.",
    ],
    note: "Draft PPI bisa disimpan berulang tanpa batas.",
  },
];

export default function PanduanPage() {
  return (
    <>
      <section className="pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <Reveal className="max-w-[44ch]">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Panduan Guru
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-5xl">
              Enam pekerjaan dari daftar siswa sampai PPI
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Urutan ini adalah alur kerja Fitra. Kerjakan berurutan untuk hasil
              yang paling rapi.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[16rem_1fr]">
            <nav aria-label="Daftar isi panduan" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold">Daftar isi</p>
              <ul className="mt-4 space-y-2">
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <a
                      href={`#${chapter.id}`}
                      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {chapter.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-14">
              {chapters.map((chapter) => (
                <Reveal key={chapter.id} delay={0.03}>
                  <article id={chapter.id}>
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-balance">
                      {chapter.title}
                    </h2>
                    <p className="mt-3 max-w-[64ch] leading-relaxed text-muted-foreground">
                      {chapter.body}
                    </p>
                    <Accordion type="single" collapsible className="mt-6">
                      <AccordionItem value={chapter.id}>
                        <AccordionTrigger className="text-sm">
                          Lihat langkah {chapter.steps.length} langkah
                        </AccordionTrigger>
                        <AccordionContent>
                          <ol className="space-y-2.5 pl-4">
                            {chapter.steps.map((step, i) => (
                              <li key={step} className="list-decimal text-sm">
                                <span className="text-muted-foreground">{i + 1}.</span>{" "}
                                {step}
                              </li>
                            ))}
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <p className="mt-4 max-w-[64ch] border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">
                      {chapter.note}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t py-16 md:py-20">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-5 px-4 md:px-8">
          <h2 className="max-w-[28ch] font-heading text-2xl font-bold tracking-tight text-balance md:text-3xl">
            Sudah punya akun? Mulai dari kelas pertama Anda
          </h2>
          <Button asChild size="lg" className="h-12 px-6 whitespace-nowrap">
            <Link href="/masuk">Masuk ke Fitra</Link>
          </Button>
        </div>
      </section>
    </>
  );
}