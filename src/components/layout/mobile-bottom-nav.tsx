"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Bottom navigation untuk viewport < 768px (Bab 7). */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu cepat"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {mobileNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[var(--spacing-student-tap)] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors active:translate-y-px",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}