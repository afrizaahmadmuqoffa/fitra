import {
  BookOpen,
  ChartNoAxesColumn,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Target tur dashboard (driver.js). Kosong berarti tidak disorot. */
  tour?: string;
}

/** Sidebar Guru (Bab 7). Tidak ada entri notifikasi: notifikasi hanya di header bell. */
export const dashboardNav: NavItem[] = [
  {
    label: "Dasbor",
    href: "/dashboard",
    icon: LayoutDashboard,
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
    tour: "nav-kelas",
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
    tour: "nav-progres",
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

export const publicNav: { label: string; href: string }[] = [
  { label: "Masalah", href: "/#masalah" },
  { label: "Solusi", href: "/#solusi" },
  { label: "Fitur", href: "/#fitur" },
  { label: "Cara kerja", href: "/#cara-kerja" },
  { label: "Tentang", href: "/#tentang" },
];
