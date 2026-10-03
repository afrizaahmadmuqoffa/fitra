"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Home, PartyPopper, RotateCcw, Star } from "lucide-react";

const TAP = "min-h-[var(--spacing-student-tap)]";

function starsFor(score: number) {
  if (score >= 1) return 3;
  if (score >= 0.6) return 2;
  return 1;
}

export function StudentDone({
  studentName,
  photoUrl,
  sessionCorrect,
  sessionAnswered,
  sessionTotal,
  allCorrect,
  allRecords,
  minutes,
  listHref,
  homeHref,
}: {
  studentName: string;
  photoUrl: string;
  sessionCorrect: number;
  sessionAnswered: number;
  sessionTotal: number;
  allCorrect: number;
  allRecords: number;
  minutes: number;
  listHref: string;
  homeHref: string;
}) {
  const reduce = useReducedMotion();
  const ratio = sessionTotal > 0 ? sessionCorrect / sessionTotal : 0;
  const stars = starsFor(ratio);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-6">
      <Card className="border-2 border-primary/30">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <motion.div
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
          >
            <span className="grid size-20 place-items-center rounded-3xl bg-accent text-accent-foreground">
              <PartyPopper className="size-10" aria-hidden="true" />
            </span>
          </motion.div>

          <div>
            <h1 className="font-heading text-3xl font-bold">
              Selesai belajar, {studentName}!
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Kamu sudah menyelesaikan sesi hari ini. Guru melihat hasil belajarmu di
              dasbor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="size-14">
              <AvatarImage src={photoUrl} alt="" />
              <AvatarFallback className="text-lg">{studentName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex gap-1.5" aria-label={`${stars} dari 3 bintang`}>
              {[0, 1, 2].map((index) => (
                <Star
                  key={index}
                  aria-hidden="true"
                  className={
                    index < stars
                      ? "size-8 fill-warning text-warning"
                      : "size-8 text-muted-foreground/40"
                  }
                />
              ))}
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Jawaban benar sesi ini</span>
              <span className="font-medium tabular-nums">
                {sessionCorrect} dari {sessionTotal || sessionAnswered}
              </span>
            </div>
            <Progress
              value={Math.round(ratio * 100)}
              className="h-2"
              indicatorClassName="bg-success"
              aria-label="Ketepatan sesi ini"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-muted/50">
        <CardContent className="space-y-3 py-5">
          <p className="font-heading text-base font-semibold">Rekam jejak belajarmu</p>
          <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Jawaban benar</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">
                {allCorrect}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Total jawaban</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">
                {allRecords}
              </dd>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <dt className="text-xs text-muted-foreground">Menit belajar</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums">{minutes}</dd>
            </div>
          </dl>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Besok ada materi baru yang bisa kamu baca. Jangan lupa untuk memindai kartu
            QR di meja guru.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className={TAP}>
          <Link href={listHref}>
            <RotateCcw className="size-5" aria-hidden="true" />
            Baca materi lain
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className={TAP} asChild>
          <Link href={homeHref}>
            <Home className="size-5" aria-hidden="true" />
            Kembali ke layar awal
          </Link>
        </Button>
      </div>
    </div>
  );
}