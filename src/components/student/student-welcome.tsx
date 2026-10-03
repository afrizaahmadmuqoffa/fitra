"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStudentAdaptive } from "@/components/student/adaptive-provider";
import { ArrowRight, BookOpen, PlayCircle, Sparkles } from "lucide-react";
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
    <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-5">
      <Card className="border-2 border-primary/30">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <Avatar className="size-24">
            <AvatarImage src={student.photoUrl} alt="" />
            <AvatarFallback className="text-2xl">{student.nickname.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">Halo,</p>
            <h1 className="font-heading text-3xl font-bold">{displayName}!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {classNames.length ? classNames.join(" dan ") : "Kelasmu"}
              {subjectCount ? ` - ${subjectCount} mata pelajaran` : ""}
            </p>
          </div>

          {simulation ? (
            <p className="rounded-lg bg-warning/15 px-4 py-2 text-sm font-medium text-warning-foreground">
              Mode simulasi aktif. Tampilan mengikuti profil {profile.name}.
            </p>
          ) : null}

          <Button asChild size="lg" className={`${TAP} w-full max-w-sm text-lg`}>
            <Link href={sessionHref}>
              <PlayCircle className="size-7" aria-hidden="true" />
              Mulai Belajar
              <ArrowRight className="size-6" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <BookOpen className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {publishedCount}
              </p>
              <p className="text-sm text-muted-foreground">Materi siap dibaca hari ini</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Sparkles className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-2xl font-semibold">Disiapkan gurumu</p>
              <p className="text-sm text-muted-foreground">
                Materi sudah disesuaikan dengan caramu belajar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}