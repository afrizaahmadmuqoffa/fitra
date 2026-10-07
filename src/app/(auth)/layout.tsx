import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-start gap-8 overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex">
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full text-primary-foreground"
          viewBox="0 0 400 700"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="auth-glow" cx="82%" cy="18%" r="75%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <pattern id="auth-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="400" height="700" fill="url(#auth-glow)" />
          <rect x="240" y="0" width="160" height="700" fill="url(#auth-dots)" opacity="0.45" />
          <circle cx="350" cy="120" r="116" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />
          <circle cx="350" cy="120" r="82" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.06" />
          <circle cx="350" cy="120" r="5" fill="currentColor" opacity="0.18" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.12"
            d="M-40 190 C65 112 151 249 255 178 S383 118 445 151"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.09"
            d="M-35 222 C75 146 153 280 262 210 S388 151 446 183"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.07"
            d="M-45 410 C67 338 157 473 267 399 S389 343 449 375"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.1"
            d="M-40 445 C72 368 160 509 273 431 S391 378 450 410"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.13"
            d="M190 532 C226 493 263 493 300 532 C337 571 374 571 410 532 M300 532 V590 M270 590 H330"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.08"
            d="M-45 586 C66 516 158 649 267 575 S387 521 448 551"
          />
          <path d="M86 91 L91 78 L96 91 L109 96 L96 101 L91 114 L86 101 L73 96 Z" fill="currentColor" opacity="0.14" />
          <circle cx="319" cy="298" r="4" fill="currentColor" opacity="0.22" />
          <circle cx="341" cy="319" r="2.5" fill="currentColor" opacity="0.16" />
          <circle cx="69" cy="528" r="3" fill="currentColor" opacity="0.18" />
        </svg>
        <Link
          href="/"
          className="relative z-10 flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
        >
          <Image
            src="/logo.png"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="size-8 rounded-[10px] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
          />
          {APP_NAME}
        </Link>
        <div className="relative z-10 my-auto max-w-[36ch]">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight">
            Satu Materi, Banyak Cara Belajar
          </h1>
          <p className="mt-5 text-base leading-relaxed text-primary-foreground/85">
            Fitra mengubah satu materi pelajaran menjadi versi yang menyesuaikan
            kemampuan, media, dan cara interaksi setiap siswa SLB.
          </p>
        </div>
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