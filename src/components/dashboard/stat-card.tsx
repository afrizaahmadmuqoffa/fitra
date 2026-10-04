import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
  tour,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  className?: string;
  /** Target tur dashboard (driver.js). */
  tour?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      {href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
          Buka
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Card
        data-tour={tour}
        className={cn(
          "border-border/80 bg-card transition-colors hover:border-primary/40 focus-within:border-primary/60",
          className,
        )}
      >
        <Link
          href={href}
          className="block rounded-xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {body}
        </Link>
      </Card>
    );
  }

  return (
    <Card data-tour={tour} className={cn("border-border/80 bg-card p-4", className)}>
      {body}
    </Card>
  );
}