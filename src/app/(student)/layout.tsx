import type { ReactNode } from "react";
import Image from "next/image";
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
            <Image
              src="/logo.png"
              alt=""
              aria-hidden
              width={32}
              height={32}
              className="size-8 rounded-[10px] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
            />
            {APP_NAME}
          </Link>
        </div>
      </header>
      <main id="konten-utama" className="relative flex-1 pb-28 md:pb-12">
        {children}
      </main>
    </div>
  );
}
