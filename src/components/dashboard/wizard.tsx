"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
  description: string;
};

export function WizardProgress({
  steps,
  current,
  className,
}: {
  steps: WizardStep[];
  current: number;
  className?: string;
}) {
  return (
    <nav aria-label="Tahapan pengisian" className={cn("w-full", className)}>
      <ol className="grid gap-3 sm:grid-cols-3 sm:gap-2">
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "current" : "todo";
          return (
            <li
              key={step.id}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                state === "current" && "border-primary bg-accent/50",
                state === "done" && "border-success/40 bg-success/6",
                state === "todo" && "border-border bg-card",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  state === "current" && "border-primary bg-primary text-primary-foreground",
                  state === "done" && "border-success bg-success text-success-foreground",
                  state === "todo" && "border-border text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {state === "done" ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{step.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}