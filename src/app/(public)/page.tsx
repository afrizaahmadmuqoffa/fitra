import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Masalah } from "@/components/marketing/masalah";
import { Solusi } from "@/components/marketing/solusi";
import { CaraKerja, Fitur } from "@/components/marketing/fitur";
import { TentangSection } from "@/components/marketing/tentang-section";
import { PanduanSection } from "@/components/marketing/panduan-section";
import { CtaDaftar } from "@/components/marketing/testimoni";

export const metadata: Metadata = {
  title: "Satu Materi, Banyak Cara Belajar",
  description:
    "Fitra membantu guru SLB mengubah satu materi pelajaran menjadi versi yang menyesuaikan kemampuan, media, dan interaksi setiap siswa. Guru tetap mengurasi dan menyetujui setiap materi.",
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Fitra",
  description:
    "Platform adaptasi pembelajaran berbasis AI untuk guru Sekolah Luar Biasa di Indonesia.",
  url: "http://localhost:3000",
  areaServed: "Indonesia",
  availableLanguage: "id-ID",
  knowsAbout: [
    "Pendidikan inklusif",
    "Sekolah Luar Biasa",
    "Diferensiasi pembelajaran",
    "Program Pendidikan Individual",
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Hero />
      <Masalah />
      <Solusi />
      <Fitur />
      <CaraKerja />
      <TentangSection />
      <PanduanSection />
      <CtaDaftar />
    </>
  );
}
