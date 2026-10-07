"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentAdaptive } from "@/components/student/adaptive-provider";
import { ArrowRight, BookOpen, Check, Clock3, Sparkles, Trophy } from "lucide-react";
import type { ActiveMaterialRow } from "@/db/queries";
import type { Student } from "@/lib/dummy/types";

const TAP = "min-h-[var(--spacing-student-tap)]";

export function StudentSessionList({
  student,
  classNames,
  items,
  attempted,
  records,
  backHref,
  doneHref,
}: {
  student: Student;
  classNames: string[];
  items: ActiveMaterialRow[];
  attempted: string[];
  records: { sessionId: string; isCorrect: boolean | null }[];
  backHref: string;
  doneHref: string;
}) {
  const { profile, simulation } = useStudentAdaptive();
  const displayName = simulation ? profile.nickname : student.nickname;
  const correct = records.filter((record) => record.isCorrect).length;
  const accuracy = records.length ? Math.round((correct / records.length) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#33635a]/70 shadow-sm ring-1 ring-black/[0.03]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Rak belajar
          </div>
          <h1 className="mt-4 font-heading text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            Pilih petualanganmu, {displayName}.
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[#17352f]/58 sm:text-lg">
            {classNames.length ? classNames.join(" dan ") : "Kelasmu"} · {items.length} materi tersedia. Pilih satu, lalu belajar dengan ritmemu sendiri.
          </p>
        </div>
        <Link href={backHref} className="text-sm font-bold text-[#33635a] hover:underline">Kembali ke sapaan</Link>
      </div>

      {items.length === 0 ? (
        <div className="relative mt-7 overflow-hidden rounded-[2.5rem] border border-dashed border-[#33635a]/20 bg-white/70 px-6 py-14 text-center shadow-sm">
          <div className="absolute left-6 top-6 size-10 rotate-12 rounded-2xl bg-[#ffe9a6]/70" aria-hidden="true" />
          <div className="absolute right-6 bottom-6 size-12 -rotate-12 rounded-2xl bg-[#cbe7f6]/75" aria-hidden="true" />
          <div className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-[#e9f7f1] text-[#33635a]">
            <BookOpen className="size-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-heading text-2xl font-black">Rakmu masih kosong.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#17352f]/58 sm:text-base">
            Gurumu sedang menyiapkan materi yang cocok untukmu. Nanti materi yang sudah diterbitkan akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {items.map((item, itemIndex) => {
            const started = attempted.includes(item.adaptationId);
            const tones = ["bg-[#eff9f4]", "bg-[#fff8e0]", "bg-[#eef8fd]", "bg-[#f0edfd]"];
            const tone = tones[itemIndex % tones.length];
            return (
              <Link
                key={item.adaptationId}
                href={`${backHref}/sesi/${item.adaptationId}`}
                className={`group block overflow-hidden rounded-[2.25rem] border border-white/80 ${tone} shadow-[0_12px_35px_rgba(23,53,47,.06)] outline-none transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#33635a]/35 active:scale-[0.995]`}
              >
                <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/80 text-[#33635a] shadow-sm">
                      <span className="font-heading text-xl font-black">{String(itemIndex + 1).padStart(2, "0")}</span>
                    </div>
                    <Badge className={started ? "bg-white/80 text-[#33635a] hover:bg-white/80" : "bg-[#33635a] text-white hover:bg-[#33635a]"}>
                      {started ? <><Check className="mr-1 size-3.5" /> Sudah dibaca</> : "Materi baru"}
                    </Badge>
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-heading text-xl font-black tracking-[-0.02em] sm:text-2xl">{item.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-[#17352f]/52">
                      <span>{item.subject}</span>
                      <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" /> {item.sections} bagian</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {Math.max(2, item.sections * 2)} menit</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/75">
                      <div className={`h-full rounded-full bg-[#33635a] transition-[width] duration-300 ease-out ${started ? "w-full" : "w-[18%]"}`} />
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[#33635a]/55">
                      {started ? "Kamu bisa mengulang kapan saja" : "Siap untuk dicoba"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center">
                    <div className="grid size-12 place-items-center rounded-2xl bg-[#33635a] text-white shadow-sm transition-transform duration-200 ease-out group-hover:translate-x-1">
                      <ArrowRight className="size-5" aria-hidden="true" />
                    </div>
                    <span className="mt-2 hidden text-xs font-bold text-[#17352f]/40 sm:block">{started ? "Baca lagi" : "Mulai"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="rounded-[2.25rem] border border-white/80 bg-white/70 p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#ffe9a6] text-[#735d18]"><Trophy className="size-5" aria-hidden="true" /></div>
            <div>
              <p className="font-heading text-base font-black">Jejak belajarmu</p>
              <p className="text-sm text-[#17352f]/50">{correct} dari {records.length} jawaban benar · {accuracy}% ketepatan</p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#ecebe3]">
            <div className="h-full rounded-full bg-[#33635a] transition-[width] duration-300 ease-out" style={{ width: `${accuracy}%` }} />
          </div>
        </div>
        <Button asChild variant="outline" size="lg" className={`${TAP} rounded-2xl border-[#17352f]/10 bg-white/80 font-bold text-[#17352f] active:scale-[0.97]`}>
          <Link href={doneHref}>Lihat ringkasan</Link>
        </Button>
      </section>
    </div>
  );
}
