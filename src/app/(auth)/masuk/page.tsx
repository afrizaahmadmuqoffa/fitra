import type { Metadata } from "next";
import { MasukClient } from "./masuk-client";

export const metadata: Metadata = {
  title: "Masuk atau Daftar",
  description: "Masuk ke Fitra sebagai guru SLB, atau buat akun baru secara gratis.",
  robots: { index: false, follow: true },
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <MasukClient nextPath={params.next ?? null} errorCode={params.error ?? null} />;
}