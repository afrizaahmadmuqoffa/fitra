import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

export function StudentLoadingPlaceholder({
  title,
  body,
  listHref,
}: {
  title: string;
  body: string;
  listHref: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-6">
      <Card className="border-2 border-primary/30">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <BookOpen className="size-7" aria-hidden="true" />
          </span>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            {body}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-2 min-h-[var(--spacing-student-tap)]"
            asChild
          >
            <Link href={listHref}>
              <ArrowLeft className="size-5" aria-hidden="true" />
              Kembali ke daftar materi
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}