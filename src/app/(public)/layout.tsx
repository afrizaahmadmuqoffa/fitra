import type { ReactNode } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { RevealObserver } from "@/components/marketing/reveal-observer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <PublicNavbar />
      <main id="konten-utama" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      <RevealObserver />
    </div>
  );
}