import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { INTERACTION_LABELS, LEVEL_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@/lib/dummy/types";

const LEVEL_WEIGHT: Record<SkillLevel, number> = {
  low: 33,
  medium: 66,
  high: 100,
};

const LEVEL_TONE: Record<SkillLevel, string> = {
  low: "bg-warning",
  medium: "bg-info",
  high: "bg-success",
};

export function SkillBarList({
  items,
  className,
}: {
  items: { label: string; value: SkillLevel }[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm">{item.label}</span>
            <span className="text-xs text-muted-foreground">
              {LEVEL_LABELS[item.value]}
            </span>
          </div>
          <Progress
            value={LEVEL_WEIGHT[item.value]}
            className="mt-1.5"
            indicatorClassName={LEVEL_TONE[item.value]}
            aria-label={`Tingkat ${item.label}: ${LEVEL_LABELS[item.value]}`}
          />
        </li>
      ))}
    </ul>
  );
}

export function PreferenceChips({
  preferences,
  className,
}: {
  preferences: { visual: boolean; audio: boolean; kinestetik: boolean };
  className?: string;
}) {
  const items: { key: keyof typeof preferences; label: string }[] = [
    { key: "visual", label: "Visual" },
    { key: "audio", label: "Audio" },
    { key: "kinestetik", label: "Kinestetik" },
  ];
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item.key}>
          <Badge
            variant={preferences[item.key] ? "default" : "outline"}
            className={preferences[item.key] ? undefined : "text-muted-foreground"}
          >
            {item.label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function InteractionModeList({
  modes,
  className,
}: {
  modes: Record<string, boolean>;
  className?: string;
}) {
  const items = Object.entries(modes);
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map(([key, enabled]) => (
        <li key={key}>
          <Badge
            variant={enabled ? "default" : "outline"}
            className={enabled ? undefined : "text-muted-foreground"}
          >
            {INTERACTION_LABELS[key] ?? key}
          </Badge>
        </li>
      ))}
    </ul>
  );
}