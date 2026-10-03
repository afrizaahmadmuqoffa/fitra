import type { Metadata } from "next";
import { MasukClient } from "./masuk-client";

export const metadata: Metadata = {
  title: "Masuk atau Daftar",
  description: "Masuk ke Fitra sebagai guru SLB, atau buat akun baru secara gratis.",
  robots: { index: false, follow: true },
};

export default function MasukPage() {
  return <MasukClient />;
}