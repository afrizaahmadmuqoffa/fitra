"use client";

import { Sparkles, Users, BookOpen, Wand2, Layers, GaugeCircle } from "lucide-react";

/**
 * Floating icon constellation for Hero background.
 * Six icons positioned in subtle grid, slow rotation.
 */
export function IconConstellation() {
  const icons = [
    { Icon: Sparkles, className: "top-[15%] left-[10%]", delay: "0s" },
    { Icon: Users, className: "top-[20%] right-[15%]", delay: "5s" },
    { Icon: BookOpen, className: "top-[50%] left-[5%]", delay: "10s" },
    { Icon: Layers, className: "top-[55%] right-[8%]", delay: "15s" },
    { Icon: Wand2, className: "bottom-[25%] left-[12%]", delay: "20s" },
    { Icon: GaugeCircle, className: "bottom-[20%] right-[18%]", delay: "25s" },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {icons.map(({ Icon, className, delay }, i) => (
        <div
          key={i}
          className={`absolute ${className} animate-[orbit_30s_linear_infinite] text-muted-foreground/25 motion-reduce:animate-none`}
          style={{ animationDelay: delay }}
        >
          <Icon className="size-10" />
        </div>
      ))}
    </div>
  );
}
