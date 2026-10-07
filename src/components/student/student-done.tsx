"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Home, PartyPopper, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";

const TAP = "min-h-[var(--spacing-student-tap)]";

function starsFor(score: number) { if (score >= 1) return 3; if (score >= 0.6) return 2; return 1; }

export function StudentDone({ studentName, photoUrl, sessionCorrect, sessionAnswered, sessionTotal, allCorrect, allRecords, minutes, listHref, homeHref }: {
  studentName: string; photoUrl: string; sessionCorrect: number; sessionAnswered: number; sessionTotal: number; allCorrect: number; allRecords: number; minutes: number; listHref: string; homeHref: string;
}) {
  const reduce = useReducedMotion();
  const ratio = sessionTotal > 0 ? sessionCorrect / sessionTotal : 0;
  const stars = starsFor(ratio);
  const confetti = [
    ["8%", "12%", "#bfead4", "-12deg"], ["18%", "74%", "#ffd8bf", "18deg"], ["80%", "16%", "#ffe9a6", "28deg"], ["88%", "70%", "#cbe7f6", "-18deg"], ["48%", "5%", "#ddd8fb", "12deg"],
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="relative overflow-hidden rounded-[3rem] border border-white/90 bg-white/82 shadow-[0_30px_100px_rgba(23,53,47,.12)] backdrop-blur-xl">
        {confetti.map(([left, top, color, rotate], index) => (
          <motion.span key={index} aria-hidden="true" className="absolute size-5 rounded-lg" style={{ left, top, background: color, rotate }} initial={reduce ? false : { scale: 0, opacity: 0 }} animate={reduce ? undefined : { scale: 1, opacity: 1 }} transition={reduce ? undefined : { duration: 0.35, delay: index * 0.06, ease: "easeOut" }} />
        ))}

        <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center md:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eff9f4] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#33635a]"><PartyPopper className="size-3.5" /> Sesi selesai</span>
            <h1 className="mt-5 max-w-2xl font-heading text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl">Keren, {studentName}. Kamu sudah sampai di garis akhir! 🎉</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#17352f]/58 sm:text-lg">Tidak perlu sempurna untuk menjadi hebat. Setiap jawaban dan setiap usaha tadi adalah bagian dari belajarmu.</p>

            <div className="mt-7 flex items-center gap-4 rounded-[1.75rem] bg-[#fff8e0] p-4">
              <Avatar className="size-16 border-4 border-white shadow-sm"><AvatarImage src={photoUrl} alt="" /><AvatarFallback className="bg-[#33635a] text-xl font-black text-white">{studentName.slice(0, 2)}</AvatarFallback></Avatar>
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#735d18]/60">Bintang hari ini</p><div className="mt-1 flex gap-1.5">{[0,1,2].map((i) => <Star key={i} aria-hidden="true" className={i < stars ? "size-7 fill-[#efb94f] text-[#efb94f]" : "size-7 text-[#735d18]/20"} />)}</div></div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs">
            <div className="relative grid aspect-square place-items-center rounded-[3rem] bg-[#bfead4] p-6 shadow-[0_24px_60px_rgba(23,53,47,.12)]">
              <div className="absolute inset-5 rounded-[2.5rem] border-2 border-dashed border-[#33635a]/20" />
              <div className="relative grid size-36 place-items-center rounded-[2.5rem] bg-white shadow-lg sm:size-44"><Trophy className="size-20 text-[#33635a]" /><Sparkles className="absolute -right-1 top-3 size-8 text-[#efb94f]" /></div>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#17352f] px-4 py-2 text-xs font-black text-white">{sessionCorrect}/{sessionTotal || sessionAnswered} tepat</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#17352f]/6 bg-[#fafaf5]/80 p-5 sm:grid-cols-3 sm:p-6">
          <Metric value={sessionCorrect} label="Jawaban tepat sesi ini" tone="mint" />
          <Metric value={allRecords} label="Total jawaban" tone="sky" />
          <Metric value={`${minutes} m`} label="Waktu belajar" tone="butter" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className={`${TAP} group flex-1 rounded-2xl bg-[#33635a] font-black text-white shadow-sm hover:bg-[#29574e] active:scale-[0.97]`}><Link href={listHref}><RotateCcw className="size-5" /> Baca materi lain <ArrowRight className="size-5 transition-transform duration-180 group-hover:translate-x-0.5" /></Link></Button>
        <Button asChild size="lg" variant="outline" className={`${TAP} rounded-2xl border-[#17352f]/10 bg-white/80 font-bold text-[#17352f] active:scale-[0.97]`}><Link href={homeHref}><Home className="size-5" /> Kembali ke awal</Link></Button>
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-[#17352f]/40">Besok, kita lanjut lagi. 🌱</p>
    </div>
  );
}

function Metric({ value, label, tone }: { value: string | number; label: string; tone: "mint" | "sky" | "butter" }) {
  const styles = tone === "mint" ? "bg-[#eff9f4] border-[#bfead4]" : tone === "sky" ? "bg-[#eef8fd] border-[#cbe7f6]" : "bg-[#fff9df] border-[#ffe9a6]";
  return <div className={`rounded-[1.75rem] border p-4 ${styles}`}><p className="font-heading text-3xl font-black tracking-[-0.04em] text-[#17352f]">{value}</p><p className="mt-1 text-sm font-semibold text-[#17352f]/50">{label}</p></div>;
}