"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentBackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="lg"
      className="group min-h-[var(--spacing-student-tap)] rounded-2xl px-3 text-base font-bold text-[#17352f] hover:bg-white/80 hover:text-[#17352f] active:scale-[0.97]"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      style={{ transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease-out" }}
    >
      <ArrowLeft className="size-5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" aria-hidden="true" />
      <span className="hidden sm:inline">Kembali</span>
    </Button>
  );
}
