import type { ReactNode } from "react";
import Link from "next/link";
import { StudentBackButton } from "@/components/student/student-back-button";
import { APP_NAME } from "@/lib/constants";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--spacing-student-tap)] max-w-3xl items-center gap-2 px-2">
          <StudentBackButton />
          <Link
            href="/"
            className="ml-auto font-heading text-base font-bold tracking-tight"
          >
            {APP_NAME}
          </Link>
        </div>
      </header>
      <main id="konten-utama" className="flex-1 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  );
}