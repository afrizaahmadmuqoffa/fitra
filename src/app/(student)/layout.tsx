import type { ReactNode } from "react";
import Link from "next/link";
import { StudentBackButton } from "@/components/student/student-back-button";
import { StudentBackdrop } from "@/components/student/student-backdrop";
import { APP_NAME } from "@/lib/constants";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#f7f6ef] text-[#17352f]">
      <StudentBackdrop />
      <header className="sticky top-0 z-50 border-b border-white/70 bg-[#f7f6ef]/72 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--spacing-student-tap)] max-w-5xl items-center gap-2 px-3 sm:px-5">
          <StudentBackButton />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-2 rounded-2xl px-3 py-2 font-heading text-sm font-black tracking-tight text-[#17352f] transition-transform duration-160 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <span className="grid size-8 place-items-center rounded-xl bg-[#33635a] text-white shadow-sm">
              <span className="size-2.5 rounded-full bg-[#bfead4]" />
            </span>
            {APP_NAME}
          </Link>
        </div>
      </header>
      <main id="konten-utama" className="relative flex-1 pb-28 md:pb-12">
        {children}
      </main>
      <style jsx global>{`
        :root {
          --fitra-ink: #17352f;
          --fitra-primary: #33635a;
          --fitra-mint: #bfead4;
          --fitra-peach: #ffd8bf;
          --fitra-butter: #ffe9a6;
          --fitra-sky: #cbe7f6;
          --fitra-lavender: #ddd8fb;
          --fitra-ease: cubic-bezier(0.23, 1, 0.32, 1);
        }
        .student-surface button,
        .student-surface a,
        .student-surface input,
        .student-surface [role="button"] {
          -webkit-tap-highlight-color: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
