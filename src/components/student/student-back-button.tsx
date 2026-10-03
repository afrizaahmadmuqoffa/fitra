"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentBackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="lg"
      className="min-h-[var(--spacing-student-tap)] -ml-2 gap-1 px-2 text-base"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
    >
      <ChevronLeft className="size-6" aria-hidden />
      Kembali
    </Button>
  );
}