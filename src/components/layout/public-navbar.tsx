"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme, useThemeMounted } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants";
import { publicNav } from "@/lib/nav";

export function PublicNavbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const themeMounted = useThemeMounted();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[72px] border-b transition-colors duration-300 ${
        scrolled
          ? "border-border bg-background/90 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="relative mx-auto grid h-full max-w-350 grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            F
          </span>
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:translate-y-px"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="col-start-3 flex items-center justify-end gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              !themeMounted
                ? "Ganti tema"
                : resolvedTheme === "dark"
                  ? "Beralih ke mode terang"
                  : "Beralih ke mode gelap"
            }
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {!themeMounted ? (
              <span className="size-5" aria-hidden />
            ) : resolvedTheme === "dark" ? (
              <Sun />
            ) : (
              <Moon />
            )}
          </Button>

          {/* Masuk — desktop only */}
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/masuk">Masuk</Link>
          </Button>

          {/* Daftar Gratis — desktop only, removed on mobile */}
          <Button asChild className="hidden lg:inline-flex whitespace-nowrap">
            <Link href="/masuk">Daftar Gratis</Link>
          </Button>

          {/* Hamburger — mobile/tablet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="flex w-[min(22rem,88vw)] flex-col p-0">
              {/* Sidebar header */}
              <div className="flex items-center gap-2.5 border-b px-5 py-4">
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
                >
                  F
                </span>
                <SheetTitle className="font-heading text-base font-bold tracking-tight">
                  {APP_NAME}
                </SheetTitle>
              </div>

              {/* Nav links */}
              <nav aria-label="Navigasi mobile" className="flex-1 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Menu
                </p>
                <ul className="space-y-0.5">
                  {publicNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        {/* Dot indicator */}
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                        />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Sidebar footer — CTA */}
              <div className="border-t px-4 py-5 space-y-2.5">
                {/* Daftar Gratis CTA */}
                <Button asChild className="w-full gap-2" size="lg">
                  <Link href="/masuk" onClick={() => setOpen(false)}>
                    Daftar Gratis
                  </Link>
                </Button>
                {/* Masuk secondary */}
                <Button asChild variant="outline" className="w-full" size="default">
                  <Link href="/masuk" onClick={() => setOpen(false)}>
                    Masuk
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
