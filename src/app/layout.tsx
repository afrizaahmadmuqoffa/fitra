import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Fitra - Platform Adaptasi Pembelajaran untuk Guru SLB",
    template: "%s - Fitra",
  },
  description:
    "Fitra mengubah satu materi pelajaran menjadi versi yang menyesuaikan kemampuan setiap siswa SLB. Guru tetap kurasi dan menyetujui setiap materi sebelum terbit.",
  keywords: ["SLB", "pendidikan inklusif", "difrensiasi", "PPI", "materi adaptif"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Fitra",
    title: "Fitra - Platform Adaptasi Pembelajaran untuk Guru SLB",
    description:
      "Satu materi, banyak cara belajar. Adaptasi materi otomatis per profil siswa, tetap dikurasi guru.",

  },
  twitter: {
    card: "summary_large_image",
    title: "Fitra - Platform Adaptasi Pembelajaran untuk Guru SLB",
    description:
      "Satu materi, banyak cara belajar. Adaptasi materi otomatis per profil siswa, tetap dikurasi guru.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a18" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable} antialiased`}
    >
      <body className="flex min-h-[100dvh] flex-col">
        <a href="#konten-utama" className="skip-link">
          Lewati ke konten utama
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}