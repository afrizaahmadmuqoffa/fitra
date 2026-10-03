import type { ReactNode } from "react";
import Link from "next/link";
import { StudentBackButton } from "@/components/student/student-back-button";
import { StudentAdaptiveProvider } from "@/components/student/adaptive-provider";
import { APP_NAME } from "@/lib/constants";
import { getSimulatedProfiles } from "@/lib/dummy/queries";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profiles = await getSimulatedProfiles();

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
        <StudentAdaptiveProvider profiles={profiles}>{children}</StudentAdaptiveProvider>
      </main>
    </div>
  );
}