import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-primary px-10 py-12 text-primary-foreground lg:flex">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-[10px] bg-primary-foreground text-sm font-bold text-primary"
          >
            F
          </span>
          {APP_NAME}
        </Link>
        <div className="max-w-[34ch]">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight">
            Setiap siswa punya cara belajar yang berbeda.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-primary-foreground/85">
            Fitra membantu Anda mengubah satu materi menjadi versi yang
            menyesuaikan kemampuan, media, dan cara interaksi setiap siswa.
            Anda tetap memeriksa dan menyetujui sebelum materi terbit.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-primary-foreground/80">
          <li>Kelas kecil, materi pendek, kalimat sederhana.</li>
          <li>Audio, gambar besar, dan pilihan sentuh untuk semua.</li>
          <li>Siswa cukup memindai QR, tanpa mengetik kata sandi.</li>
        </ul>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Kembali ke beranda
          </Link>
          <span className="font-heading text-base font-bold">{APP_NAME}</span>
        </div>
        <main
          id="konten-utama"
          className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12"
        >
          <div className="w-full max-w-[26rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}