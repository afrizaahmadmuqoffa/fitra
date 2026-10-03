import type { Metadata } from "next";
import Link from "next/link";
import { getProgressSummary, getStudents, getStudentProfile, getTeacher } from "@/db/queries";
import { DISABILITY_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { PpiForm, type PpiStudentOption } from "@/components/dashboard/ppi/ppi-form";
import { ArrowLeft } from "lucide-react";
import type { SkillLevel, Student } from "@/lib/dummy/types";

export const metadata: Metadata = {
  title: "Buat PPI",
  description:
    "Wizard penyusunan Program Individu Plansional dengan pengisian otomatis dari profil dan progres siswa.",
};

type AutoFill = PpiStudentOption["auto"];

const CONTENT: Record<string, AutoFill> = {
  tunanetra: {
    strengths:
      "Citra cepat hafal kosakata materi, berani menjawab, dan motor halusnya baik untuk menyusun alat peraga tactile.",
    needs: [
      "Mengenali bagian tumbuhan dengan tulisan braille dan audio.",
      "Menjelaskan kembali materi dengan kalimat sendiri secara lisan.",
    ],
    objectives: [
      "Siswa mampu menyebutkan bagian tumbuhan dan fungsinya dengan minimal 3 nama benar.",
      "Siswa mampu menyusun alat peraga sederhana dengan bantuan benda nyata.",
    ],
    services: [
      "Penyajian materi memakai huruf besar dan alat peraga tactile.",
      "Audio deskripsi untuk setiap bagian materi.",
      "Pendampingan guru saat menjawab pertanyaan lisan.",
    ],
    schedule: [
      {
        day: "Senin",
        time: "08.00-08.40",
        activity: "Latih IPA: mengenal bagian tumbuhan dengan benda nyata",
      },
      {
        day: "Rabu",
        time: "09.00-09.40",
        activity: "Latih motor halus: menyusun alat peraga tactile",
      },
    ],
    materials: [
      "Model tumbuhan dan kartu bagian dengan huruf besar",
      "Speaker audio kelas",
      "Kertas tinta tebal untuk menulis dengan bantuan",
    ],
    evaluation:
      "Evaluasi melalui observasi guru, rekaman jawaban lisan, dan portofolio alat peraga setiap akhir pekan.",
    familyNotes:
      "Bacakan materi dengan kalimat satu per satu dan berikan waktu menjawab yang cukup di rumah.",
  },
  tunarungu: {
    strengths:
      "Aisyah hafal kosakata materi dengan cepat, berani tampil di depan kelas, dan motor halusnya sangat baik untuk merangkai kartu kata.",
    needs: [
      "Membaca kalimat pendek masih memerlukan pendampingan penuh.",
      "Konsep waktu sederhana perlu diperkuat dengan benda konkret.",
    ],
    objectives: [
      "Siswa mampu mengenali simbol angka 1 sampai 5 melalui kartu bergambar dengan pendampingan penuh.",
      "Siswa mampu menyebutkan nama anggota keluarga dan tugasnya dengan kosakata minimal 3 kata.",
    ],
    services: [
      "Kelas kecil maksimal 8 siswa",
      "Pendampingan guru saat mengerjakan tugas",
      "Media audio untuk setiap materi baru",
      "Latihan motor halus berupa merangkai kartu kata",
    ],
    schedule: [
      { day: "Senin", time: "08.00-08.40", activity: "Latih bahasa: menyapa anggota keluarga" },
      { day: "Rabu", time: "09.00-09.40", activity: "Latih matematika: mengenal angka 1 sampai 5" },
      { day: "Jumat", time: "08.00-08.40", activity: "Evaluasi dan refleksi mingguan" },
    ],
    materials: [
      "Kartu angka bergambar ukuran besar",
      "Buku cerita dengan huruf besar",
      "Speaker audio kelas",
      "Alat peraga warna",
    ],
    evaluation:
      "Evaluasi dilakukan melalui observasi guru selama kegiatan, rekaman jawaban lisan, dan portofolio hasil kerja siswa setiap akhir pekan.",
    familyNotes:
      "Komunikasi dengan keluarga dilakukan setiap minggu melalui buku penghubung. Latihan sederhana di rumah sangat membantu.",
  },
  tunagrahita: {
    strengths:
      "Bagas teliti, tekun, dan senang bekerja sama dengan teman sekelasnya.",
    needs: [
      "Membaca teks panjang masih memerlukan pendampingan penuh.",
      "Konsep waktu dan uang sederhana perlu diperkenalkan dengan benda nyata.",
    ],
    objectives: [
      "Siswa mampu memberi angka pada benda konkret sampai 20 dengan bantuan.",
      "Siswa mampu membandingkan jumlah benda dan menyebutkan mana yang banyak dan mana yang sedikit.",
    ],
    services: [
      "Kelas kecil maksimal 6 siswa",
      "Pendampingan penuh saat mengerjakan tugas",
      "Benda konkret untuk setiap konsep bilangan",
      "Latihan motor kasar berupa puzzle",
    ],
    schedule: [
      { day: "Senin", time: "08.00-08.40", activity: "Latih matematika: menghitung benda sampai 20" },
      { day: "Kamis", time: "09.00-09.40", activity: "Latih kemandirian: memilih barang di toko sekolah" },
    ],
    materials: [
      "Benda konkret untuk menghitung",
      "Kartu angka dan kartu pembanding jumlah",
      "Puzzle susun untuk latihan motor kasar",
    ],
    evaluation:
      "Evaluasi memakai observasi guru dengan lembar periksa dan rekap jawaban setiap akhir pekan.",
    familyNotes:
      "Beri tugas singkat di rumah dan hargai setiap usaha siswa, sekecil apa pun hasilnya.",
  },
  tunadaksa: {
    strengths:
      "Dimas menunjukkan konsentrasi tinggi, respons cepat terhadap instruksi lisan, dan motor kasarnya kuat.",
    needs: [
      "Menulis memerlukan alat bantu untuk menjaga stabilitas gerak.",
      "Berpindah tempat dan membawa alat perlu didukung kursi roda.",
    ],
    objectives: [
      "Siswa mampu menyusun kalimat sederhana secara lisan dengan urutan kata yang tepat.",
      "Siswa mampu menjelaskan jawaban dengan komunikasi alternatif dan alat tulis.",
    ],
    services: [
      "Pendampingan fisik saat memakai alat",
      "Meja belajar tinggi dan kursi roda",
      "Bahan ajar cetak ukuran besar",
    ],
    schedule: [
      { day: "Selasa", time: "10.00-10.40", activity: "Latih bahasa: menyusun kalimat sederhana" },
      { day: "Kamis", time: "10.00-10.40", activity: "Latih motor kasar: latihan menyimak dan bergerak" },
    ],
    materials: [
      "Kursi roda dan meja belajar tinggi",
      "Alat peraga ringan",
      "Kartu soal dengan huruf besar",
    ],
    evaluation:
      "Evaluasi melalui observasi guru, rekaman jawaban lisan, dan portofolio hasil kerja setiap akhir pekan.",
    familyNotes:
      "Sediakan tempat belajar yang nyaman dan bantu siswa menyimpan alatnya agar mudah dijangkau.",
  },
  autis: {
    strengths:
      "Eka fokus lebih lama saat mengerjakan tugas familiar, suka bekerja dengan benda konkret, dan komunikasinya meningkat dengan dukungan visual.",
    needs: [
      "Perlu instruksi singkat dan satu langkah pada satu waktu.",
      "Rasa kebal terhadap suara dan cahaya perlu diatur.",
    ],
    objectives: [
      "Siswa mampu menyelesaikan tiga kegiatan sederhana secara mandiri.",
      "Siswa mampu menyebutkan kebutuhannya dengan kartu komunikasi.",
    ],
    services: [
      "Instruksi singkat dan bertahap",
      "Rutinitas harian yang konsisten dengan gambar",
      "Ruang belajar dengan suara dan cahaya terkendali",
    ],
    schedule: [
      { day: "Senin", time: "08.00-08.40", activity: "Latih kemandirian: membereskan alat belajar" },
      { day: "Kamis", time: "09.00-09.40", activity: "Latih komunikasi: menunjukkan kartu kebutuhan" },
    ],
    materials: ["Kartu komunikasi bergambar", "Benda konkret sederhana", "Lembar jadwal kegiatan bergambar"],
    evaluation:
      "Evaluasi memakai lembar periksa kegiatan dan catatan guru pada setiap akhir pekan.",
    familyNotes:
      "Jaga rutinitas di rumah sama dengan di sekolah agar siswa merasa aman dan siap belajar.",
  },
  tunawicara: {
    strengths:
      "Fajar sangat kooperatif, motor kasarnya kuat, dan cepat memberi respons terhadap instruksi lisan sambil menunjuk benda.",
    needs: [
      "Komunikasi menggunakan papan komunikasi dan gestur dua kata.",
      "Kemandirian berpakaian dan menggunakan alat masih memerlukan pendampingan fisik.",
    ],
    objectives: [
      "Siswa mampu menirukan salam dengan komunikasi alternatif PECS minimal 3 kali.",
      "Siswa mampu menunjuk gambar yang benar dengan tepat 4 dari 5 kesempatan.",
      "Siswa mampu memakai alat belajar dengan pendampingan fisik.",
    ],
    services: [
      "Pendampingan fisik saat memakai alat",
      "Papan komunikasi dan kartu PECS",
      "Kelas kecil dengan maksimal 5 siswa",
      "Latihan motor kasar terjadwal",
    ],
    schedule: [
      { day: "Selasa", time: "10.00-10.40", activity: "Latih komunikasi: menyapa dan memberi salam" },
      { day: "Kamis", time: "10.00-10.40", activity: "Latih motor kasar: memindahkan bola" },
    ],
    materials: ["Papan komunikasi bergambar", "Kartu PECS", "Bola besar dan tongkat keseimbangan", "Meja belajar tinggi"],
    evaluation:
      "Evaluasi memakai observasi guru dan rekap jawaban setiap akhir pekan.",
    familyNotes:
      "Jadwal kegiatan di rumah sebaiknya sama dengan jadwal di sekolah agar mudah dibiasakan.",
  },
  tunaganda: {
    strengths:
      "Rizky berani mencoba kegiatan baru, cepat mencari bantuan ketika kesulitan, dan kooperatif saat berbagi alat.",
    needs: [
      "Menentukan jarak dan posisi benda masih memerlukan contoh visual.",
      "Mengerjakan tugas tanpa contoh konkret memerlukan pendampingan tambahan.",
    ],
    objectives: [
      "Siswa mampu membandingkan dua benda dengan kalimat sederhana.",
      "Siswa mampu menjelaskan fungsi satu bagian tumbuhan dengan bantuan.",
    ],
    services: [
      "Contoh visual dan benda nyata pada setiap konsep",
      "Pendampingan guru saat mengerjakan tugas",
      "Latihan mengulang kegiatan dengan langkah yang sama",
    ],
    schedule: [
      { day: "Rabu", time: "08.00-08.40", activity: "Latih IPA: membandingkan bagian tumbuhan" },
      { day: "Jumat", time: "09.00-09.40", activity: "Evaluasi dan refleksi mingguan" },
    ],
    materials: ["Benda nyata dan gambar besar", "Kartu kosakata", "Lembar periksa bergambar"],
    evaluation:
      "Evaluasi memakai observasi guru dan hasil kerja siswa yang dikumpulkan setiap akhir pekan.",
    familyNotes:
      "Latih kegiatan harian dengan urutan langkah yang sama seperti di sekolah.",
  },
  tunalaras: {
    strengths:
      "Sinta tekun menyelesaikan setiap bagian materi, suka mengerjakan soal bergambar, dan sabar saat menunggu giliran.",
    needs: [
      "Memahami konsep yang abstrak perlu contoh benda nyata.",
      "Menjaga perhatian selama kegiatan kelompok memerlukan penjelasan singkat dan contoh visual.",
    ],
    objectives: [
      "Siswa mampu menyebutkan bagian tumbuhan dengan bantuan benda nyata.",
      "Siswa mampu bekerja sama dalam kelompok sesuai peran yang diberikan.",
    ],
    services: [
      "Pendampingan guru saat menerima tugas baru",
      "Contoh konkret sebelum materi abstrak diberikan",
      "Evaluasi sederhana dengan foto atau gambar",
    ],
    schedule: [
      { day: "Senin", time: "08.00-08.40", activity: "Latih kemandirian: menyiapkan alat sekolah" },
      { day: "Kamis", time: "09.00-09.40", activity: "Latih kelompok: bekerja sesuai peran" },
    ],
    materials: ["Model tumbuhan dan kartu bagian", "Buku aktivitas bergambar", "Kartu langkah kegiatan"],
    evaluation:
      "Evaluasi memakai portofolio foto kegiatan dan observasi guru setiap akhir pekan.",
    familyNotes:
      "Berikan tugas rumah yang sederhana dan konkret, lalu hargai setiap usaha siswa yang selesai.",
  },
  lainnya: {
    strengths:
      "Siswa menunjukkan keinginan belajar yang baik dan cepat menyesuaikan diri terhadap kegiatan baru.",
    needs: [
      "Rincian kebutuhan diisi guru berdasarkan hasil asesmen awal.",
      "Evaluasi perlu disesuaikan pada setiap awal semester.",
    ],
    objectives: [
      "Siswa mampu menyelesaikan materi sesuai tujuan yang ditetapkan guru.",
      "Siswa mampu menunjukkan kemajuannya pada asesmen ulang.",
    ],
    services: ["Pendampingan sesuai hasil asesmen awal", "Evaluasi berkala setiap satu semester"],
    schedule: [{ day: "Senin", time: "08.00-08.40", activity: "Latih materi pilihan guru" }],
    materials: ["Bahan ajar sesuai kebutuhan siswa", "Lembar periksa sederhana"],
    evaluation:
      "Evaluasi memakai observasi guru dan rekap jawaban dari sesi belajar.",
    familyNotes:
      "Sampaikan perkembangan siswa kepada keluarga setiap akhir bulan.",
  },
};

const FALLBACK = CONTENT.lainnya;

function autoFillFor(student: Student, level: SkillLevel | null): AutoFill {
  const base = CONTENT[student.disabilityType] ?? FALLBACK;
  if (level !== "low") return base;

  return {
    ...base,
    services: [
      "Kelas kecil dengan maksimal 5 siswa",
      "Pendampingan penuh oleh guru atau pendamping",
      ...base.services.filter((item) => !item.startsWith("Kelas kecil")).slice(0, 2),
    ],
  };
}

export default async function NewPpiPage() {
  const [students, summary, teacher] = await Promise.all([
    getStudents(),
    getProgressSummary(),
    getTeacher(),
  ]);

  const options: PpiStudentOption[] = await Promise.all(
    students.map(async (student) => {
      const profile = await getStudentProfile(student.id);
      const stats = summary.find((item) => item.student.id === student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        nickname: student.nickname,
        photoUrl: student.photoUrl,
        disabilityLabel: DISABILITY_LABELS[student.disabilityType] ?? student.disabilityType,
        academicLevel: profile?.academicLevel ?? "medium",
        sessions: stats?.sessions ?? 0,
        accuracy: stats?.accuracy ?? 0,
        minutes: stats?.minutes ?? 0,
        auto: autoFillFor(student, profile?.academicLevel ?? null),
      };
    }),
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/ppi">
          <ArrowLeft />
          Kembali ke daftar PPI
        </Link>
      </Button>

      <PageHeader
        title="Buat Dokumen PPI"
        description="Pilih siswa, lengkapi asesmen yang sudah terisi otomatis, lalu lengkapi rencana layanan, jadwal, dan evaluasi."
      />

      <PpiForm students={options} teacherName={teacher.fullName} />
    </div>
  );
}