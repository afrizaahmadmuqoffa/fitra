"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStudentAdaptive } from "@/components/student/adaptive-provider";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, CircleCheck, Trophy } from "lucide-react";
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
    <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-5">
      <div>
        <h1 className="font-heading text-2xl font-bold">Materi untukmu, {displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {classNames.join(" dan ")} - {items.length} materi sudah disiapkan gurumu.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed px-6 py-12 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-heading text-lg font-semibold">
            Belum ada materi hari ini
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Gurumu sedang menyiapkan materi yang disesuaikan dengan caramu belajar.
            Coba lagi setelah guru menerbitkannya.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const started = attempted.includes(item.adaptationId);
            return (
              <li key={item.adaptationId}>
                <Card
                  className={cn(
                    "border-2 transition-colors",
                    started ? "border-success/40" : "border-primary/30",
                  )}
                >
                  <CardContent className="flex flex-col gap-3 py-5">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid size-12 shrink-0 place-items-center rounded-xl",
                          started
                            ? "bg-success/12 text-success"
                            : "bg-accent text-accent-foreground",
                        )}
                      >
                        {started ? (
                          <CircleCheck className="size-6" aria-hidden="true" />
                        ) : (
                          <BookOpen className="size-6" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-lg font-semibold">{item.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {item.subject} - {item.sections} bagian
                        </p>
                        <Badge
                          className="mt-2"
                          variant={started ? "default" : "secondary"}
                        >
                          {started ? "Sudah kamu baca" : "Materi baru"}
                        </Badge>
                      </div>
                    </div>

                    <Button asChild className={TAP} size="lg">
                      <Link href={`${backHref}/sesi/${item.adaptationId}`}>
                        {started ? "Baca lagi" : "Mulai baca"}
                        <ArrowRight className="size-6" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="border-border/80 bg-muted/50">
        <CardContent className="space-y-3 py-5">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" aria-hidden="true" />
            <p className="font-heading text-base font-semibold">Hasil belajarmu</p>
          </div>
          <Progress
            value={accuracy}
            className="h-2"
            indicatorClassName="bg-primary"
            aria-label="Ketepatan jawaban yang terkumpul"
          />
          <p className="text-sm text-muted-foreground">
            {correct} dari {records.length} jawaban benar selama ini.
          </p>
          <Button variant="outline" asChild className={TAP}>
            <Link href={doneHref}>Lihat ringkasan belajar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}