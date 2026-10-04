import { UserCog, Upload, FileCheck2, Send, QrCode, BarChart3 } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const chapters = [
  {
    id: "peta-profil",
    title: "Memetakan profil belajar siswa",
    body: "Profil belajar adalah dasar dari seluruh materi yang Fitra buat. Buka menu Siswa, pilih salah satu siswa, lalu tekan Sunting Profil.",
    icon: UserCog,
    steps: [
      "Isi identitas dasar: nama, panggilan, usia, jenis kelamin, jenis hambatan, dan catatan.",
      "Petakan kemampuan akademik: membaca, menulis, berhitung.",
      "Petakan sosial-emosional: mengenali orang, bekerja sama, mengatur emosi.",
      "Petakan motorik halus dan motorik kasar.",
      "Petakan kemandirian: berpakaian, makan, menggunakan alat.",
      "Pilih preferensi belajar: visual, audio, atau kinestetik.",
      "Pilih bentuk interaksi yang bisa dilakukan siswa: sentuh, suara, ketik, sakelar tunggal, atau susun gambar.",
      "Atur tampilan siswa: ukuran teks, kontras, audio, kecepatan audio, dan gaya navigasi.",
    ],
    note: "Perubahan profil akan menandai materi yang pernah terbit sebagai Perlu Tinjau Ulang.",
  },
  {
    id: "unggah-materi",
    title: "Mengunggah dan menganalisis materi",
    body: "Buka menu Materi lalu tekan Tambah Materi. Pilih kelas target, lalu unggah berkas PDF atau DOCX, atau tempel teks materi secara langsung.",
    icon: Upload,
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
    icon: FileCheck2,
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
    icon: Send,
    steps: [
      "Pastikan minimal satu adaptasi berstatus Disetujui.",
      "Tekan Terbitkan pada materi.",
      "Materi yang terbit hanya dapat diakses siswa yang adaptasinya sudah disetujui.",
    ],
    note: "Materi yang sudah terbit tetap bisa diubah. Setiap perubahan tercatat sebagai riwayat revisi.",
  },
  {
    id: "qr",
    title: "Membuat dan membagikan QR Code",
    body: "Buka menu Kelas, pilih kelas, lalu tekan QR Code.",
    icon: QrCode,
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
    icon: BarChart3,
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

export function PanduanSection() {
  return (
    <section id="panduan" className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="max-w-[46ch]">
          <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Enam pekerjaan dari daftar siswa sampai PPI
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Urutan ini adalah alur kerja Fitra. Kerjakan berurutan untuk hasil
            yang paling rapi.
          </p>
        </Reveal>

        <div className="mt-12">
          <Accordion type="single" collapsible className="space-y-4">
            {chapters.map((chapter, i) => {
              const Icon = chapter.icon;
              return (
                <Reveal key={chapter.id} delay={i * 0.03}>
                  <AccordionItem
                    value={chapter.id}
                    className="rounded-lg border border-border bg-card px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Icon className="size-5 text-primary" aria-hidden />
                        <span className="font-heading text-lg font-semibold">
                          {chapter.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-6 pt-2">
                      <p className="leading-relaxed text-muted-foreground">
                        {chapter.body}
                      </p>
                      <ol className="space-y-2 pl-4">
                        {chapter.steps.map((step, idx) => (
                          <li key={idx} className="text-sm leading-relaxed">
                            <span className="font-medium text-foreground">
                              {idx + 1}.
                            </span>{" "}
                            {step}
                          </li>
                        ))}
                      </ol>
                      <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">
                        {chapter.note}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Reveal>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
