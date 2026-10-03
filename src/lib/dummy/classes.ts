import type { ClassRoom, ClassStudent } from "./types";

export const classes: ClassRoom[] = [
  {
    id: "cls-iv-b",
    teacherId: "usr-sri-wahyuni",
    name: "Kelas IV-B",
    subject: "Matematika dan Bahasa Indonesia",
    grade: "Kelas IV",
    description:
      "Pembelajaran numerasi dasar dan membaca kata sederhana. Fokus pada pengenalan bilangan, pola, dan kosakata sehari-hari dengan kalimat pendek.",
    room: "Ruang 4B, Lantai 2",
    createdAt: "2025-08-11",
  },
  {
    id: "cls-v-a",
    teacherId: "usr-sri-wahyuni",
    name: "Kelas V-A",
    subject: "IPA Terpadu",
    grade: "Kelas V",
    description:
      "Pengamatan sains sederhana melalui benda nyata di sekitar sekolah. Materi pendek dengan kegiatan pengamatan terstruktur dan lembar periksa bergambar.",
    room: "Ruang 5A, Lantai 2",
    createdAt: "2025-08-11",
  },
  {
    id: "cls-iv-a",
    teacherId: "usr-sri-wahyuni",
    name: "Kelas IV-A",
    subject: "Persiapan Kemandirian",
    grade: "Kelas IV",
    description:
      "Latihan kemandirian harian: berpakaian, merapikan meja, dan menggunakan uang sederhana di pasar sekolah.",
    room: "Ruang 4A, Lantai 1",
    createdAt: "2025-09-02",
  },
];

export const classStudents: ClassStudent[] = [
  { id: "cs-01", classId: "cls-iv-b", studentId: "stu-aisyah", joinedAt: "2025-08-11" },
  { id: "cs-02", classId: "cls-iv-b", studentId: "stu-bagas", joinedAt: "2025-08-11" },
  { id: "cs-03", classId: "cls-iv-b", studentId: "stu-citra", joinedAt: "2025-08-11" },
  { id: "cs-04", classId: "cls-iv-b", studentId: "stu-eka", joinedAt: "2025-08-12" },
  { id: "cs-05", classId: "cls-iv-b", studentId: "stu-fajar", joinedAt: "2025-08-12" },
  { id: "cs-06", classId: "cls-iv-b", studentId: "stu-rizky", joinedAt: "2025-08-13" },
  { id: "cs-07", classId: "cls-v-a", studentId: "stu-aisyah", joinedAt: "2025-08-14" },
  { id: "cs-08", classId: "cls-v-a", studentId: "stu-dimas", joinedAt: "2025-08-14" },
  { id: "cs-09", classId: "cls-v-a", studentId: "stu-sinta", joinedAt: "2025-08-15" },
  { id: "cs-10", classId: "cls-v-a", studentId: "stu-eka", joinedAt: "2025-08-15" },
  { id: "cs-11", classId: "cls-iv-a", studentId: "stu-bagas", joinedAt: "2025-09-02" },
  { id: "cs-12", classId: "cls-iv-a", studentId: "stu-citra", joinedAt: "2025-09-02" },
  { id: "cs-13", classId: "cls-iv-a", studentId: "stu-dimas", joinedAt: "2025-09-03" },
  { id: "cs-14", classId: "cls-iv-a", studentId: "stu-fajar", joinedAt: "2025-09-03" },
  { id: "cs-15", classId: "cls-iv-a", studentId: "stu-sinta", joinedAt: "2025-09-04" },
  { id: "cs-16", classId: "cls-iv-a", studentId: "stu-rizky", joinedAt: "2025-09-04" },
];