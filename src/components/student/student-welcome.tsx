"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStudentAdaptive } from "@/components/student/adaptive-provider";
import { ArrowRight, BookOpen, Sparkles, Star } from "lucide-react";
import type { Student } from "@/lib/dummy/types";

const TAP = "min-h-[var(--spacing-student-tap)]";

export function StudentWelcome({
  student,
  nickname,
  classNames,
  subjectCount,
  publishedCount,
  sessionHref,
}: {
  student: Student;
  nickname: string;
  classNames: string[];
  subjectCount: number;
  publishedCount: number;
  sessionHref: string;
}) {
  const { profile, simulation } = useStudentAdaptive();
  const displayName = simulation ? profile.nickname : nickname;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/90 bg-white/78 p-5 shadow-[0_25px_90px_rgba(23,53,47,.10)] backdrop-blur-xl sm:p-8 md:p-10">
        <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-[#bfead4]/60 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-[#ffe9a6]/45 blur-3xl" />

        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#33635a]/10 bg-[#f2f8f5] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#33635a]">
              <span className="size-2 rounded-full bg-[#5ecf9c]" />
              Ruang belajar pribadi
            </div>

            <p className="mt-5 text-lg font-semibold text-[#17352f]/55">Halo,</p>
            <h1 className="mt-1 max-w-xl font-heading text-4xl font-black tracking-[-0.05em] text-[#17352f] sm:text-5xl md:text-6xl">
              {displayName}<span className="text-[#33635a]">!</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#17352f]/62 sm:text-lg">
              {classNames.length ? classNames.join(" dan ") : "Kelasmu"}
              {subjectCount ? ` · ${subjectCount} mata pelajaran` : ""}. Hari ini kita belajar dengan cara yang paling cocok untukmu.
            </p>

            {simulation ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#fff4cc] px-3.5 py-2.5 text-sm font-bold text-[#735d18]">
                <Sparkles className="size-4" aria-hidden="true" />
                Mode simulasi aktif · {profile.name}
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className={`${TAP} group rounded-2xl bg-[#33635a] px-6 text-base font-black text-white shadow-[0_12px_25px_rgba(51,99,90,.20)] hover:bg-[#29574e] active:scale-[0.97]`}>
                <Link href={sessionHref}>
                  Mulai belajar
                  <ArrowRight className="size-5 transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#17352f]/55">
                <span className="grid size-9 place-items-center rounded-xl bg-[#ffe9a6]/80 text-[#735d18]">
                  <BookOpen className="size-4" aria-hidden="true" />
                </span>
                {publishedCount} materi siap belajar
              </div>
            </div>
          </div>

          <div className="order-1 flex justify-center md:order-2 md:pr-3">
            <div className="relative">
              <div className="absolute -left-5 top-8 size-14 rotate-[-12deg] rounded-[1.4rem] bg-[#cbe7f6]" aria-hidden="true" />
              <div className="absolute -bottom-3 -right-5 size-12 rotate-[12deg] rounded-[1.25rem] bg-[#ffd8bf]" aria-hidden="true" />
              <div className="relative grid size-40 place-items-center rounded-[2.75rem] border-8 border-white bg-[#bfead4] shadow-[0_22px_55px_rgba(23,53,47,.14)] sm:size-48">
                <Avatar className="size-28 border-4 border-white shadow-lg sm:size-36">
                  <AvatarImage src={student.photoUrl} alt="" />
                  <AvatarFallback className="bg-[#33635a] text-3xl font-black text-white sm:text-4xl">
                    {student.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -right-3 top-6 grid size-11 place-items-center rounded-2xl bg-white text-[#efae38] shadow-lg sm:-right-4 sm:size-12">
                  <Star className="size-6 fill-current" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <StatTile tone="mint" value={String(publishedCount)} label="Materi siap dibaca" note="Sudah disiapkan gurumu" />
        <StatTile tone="butter" value="1" label="Ruang belajar" note="Kamu punya tempat sendiri" />
        <StatTile tone="sky" value="∞" label="Cara mencoba" note="Baca, dengarkan, jawab" />
      </section>

      <p className="mt-6 text-center text-sm font-medium text-[#17352f]/42">
        Pelan-pelan saja. Yang penting, kamu terus mencoba. ✨
      </p>
    </div>
  );
}

function StatTile({ tone, value, label, note }: { tone: "mint" | "butter" | "sky"; value: string; label: string; note: string }) {
  const styles = {
    mint: "bg-[#eff9f4] border-[#bfead4]",
    butter: "bg-[#fff9df] border-[#ffe9a6]",
    sky: "bg-[#eef8fd] border-[#cbe7f6]",
  }[tone];

  return (
    <div className={`rounded-[2rem] border p-5 ${styles} transition-transform duration-200 ease-out hover:-translate-y-1`}>
      <p className="font-heading text-4xl font-black tracking-[-0.05em] text-[#17352f]">{value}</p>
      <p className="mt-2 font-heading text-base font-black text-[#17352f]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#17352f]/55">{note}</p>
    </div>
  );
}
