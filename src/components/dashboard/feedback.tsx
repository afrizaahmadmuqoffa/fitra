import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-3 border-dashed bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="font-heading text-base font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </Card>
  );
}

type Tone = "muted" | "info" | "warning" | "success" | "destructive";

const TONE_CLASS: Record<Tone, string> = {
  muted: "bg-muted text-muted-foreground",
  info: "bg-info/12 text-info dark:bg-info/20",
  warning:
    "bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning",
  success: "bg-success/12 text-success dark:bg-success/20",
  destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export function ToneBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(TONE_CLASS[tone], className)}>
      {label}
    </Badge>
  );
}

export function DisabilityBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-primary/25 bg-primary/8 text-primary", className)}
    >
      {label}
    </Badge>
  );
}

export function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTanggalPendek(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

export function formatWaktu(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDurasi(seconds: number): string {
  const menit = Math.round(seconds / 60);
  if (menit < 60) return `${menit} menit`;
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return sisa ? `${jam} jam ${sisa} menit` : `${jam} jam`;
}