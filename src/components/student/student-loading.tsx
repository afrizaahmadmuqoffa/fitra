import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";

export function StudentLoadingPlaceholder({ title, body, listHref }: { title: string; body: string; listHref: string }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/90 bg-white/82 p-7 text-center shadow-[0_24px_80px_rgba(23,53,47,.10)] backdrop-blur-xl sm:p-10">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-[#cbe7f6]/60 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-[#ffe9a6]/50 blur-2xl" aria-hidden="true" />
        <div className="relative mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-[#eff9f4] text-[#33635a]"><BookOpen className="size-9" /><Sparkles className="absolute -right-1 -top-1 size-5 text-[#efb94f]" /></div>
        <p className="relative mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#33635a]/55">Sedang disiapkan</p>
        <h1 className="relative mt-2 font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">{title}</h1>
        <p className="relative mx-auto mt-3 max-w-lg text-base leading-7 text-[#17352f]/58">{body}</p>
        <Button variant="outline" size="lg" asChild className="relative mt-6 min-h-[var(--spacing-student-tap)] rounded-2xl border-[#17352f]/10 bg-white font-bold text-[#17352f] active:scale-[0.97]"><Link href={listHref}><ArrowLeft className="size-5" /> Kembali ke materi</Link></Button>
      </div>
    </div>
  );
}
