import {
  BookOpen,
  ChartNoAxesColumn,
  FileText,
  Gauge,
  GraduationCap,
  QrCode,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/** Sidebar Guru (Bab 7). Tidak ada entri notifikasi: notifikasi hanya di header bell. */
export const dashboardNav: NavItem[] = [
  {
    label: "Dasbor",
    href: "/dashboard",
    icon: Gauge,
    description: "Ringkasan kelas dan aktivitas",
  },
  {
    label: "Siswa",
    href: "/dashboard/siswa",
    icon: Users,
    description: "Profil dan materi siswa",
  },
  {
    label: "Kelas",
    href: "/dashboard/kelas",
    icon: GraduationCap,
    description: "Kelas dan QR akses",
  },
  {
    label: "Materi",
    href: "/dashboard/materi",
    icon: BookOpen,
    description: "Unggah dan adaptasi materi",
  },
  {
    label: "Progres",
    href: "/dashboard/progres",
    icon: ChartNoAxesColumn,
    description: "Partisipasi dan waktu belajar",
  },
  {
    label: "PPI",
    href: "/dashboard/ppi",
    icon: FileText,
    description: "Dokumen Program Pendidikan Individual",
  },
  {
    label: "Pengaturan",
    href: "/dashboard/pengaturan",
    icon: Settings,
    description: "Profil guru dan notifikasi",
  },
];

/** Bottom navigation untuk mobile (5 item teratas + QR). */
export const mobileNav: NavItem[] = [
  dashboardNav[0],
  dashboardNav[1],
  dashboardNav[3],
  { label: "QR", href: "/dashboard/kelas", icon: QrCode, description: "QR akses" },
  dashboardNav[5],
];

export const publicNav: { label: string; href: string }[] = [
  { label: "Masalah", href: "/#masalah" },
  { label: "Cara kerja", href: "/#cara-kerja" },
  { label: "Fitur", href: "/#fitur" },
  { label: "Tentang", href: "/tentang" },
  { label: "Panduan", href: "/panduan" },
];
