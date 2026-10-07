"use client";

import Image from "next/image";
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
      className={`sticky top-0 z-40 h-[78px] border-b backdrop-blur-[18px] transition-colors duration-300 ${
        scrolled
          ? "border-border bg-background/90"
          : "border-border/60 bg-background/80"
      }`}
    >
      <div className="preview-container relative mx-auto flex h-full min-h-[78px] items-center px-4 md:px-8">
        {/* Logo — far left */}
        <Link
          href="/"
          className="brand inline-flex shrink-0 items-center gap-[11px] font-heading text-[19px] font-extrabold tracking-[-0.03em]"
        >
          <Image
            src="/logo.png"
            alt=""
            aria-hidden
            width={36}
            height={36}
            className="size-9 rounded-[11px] shadow-[0_7px_16px_rgba(51,99,90,0.22)]"
          />
          {APP_NAME}
        </Link>

        {/* Desktop nav — absolute center */}
        <nav
          aria-label="Navigasi utama"
          className="nav-links absolute left-1/2 hidden -translate-x-1/2 items-center gap-[26px] text-[14px] font-bold text-foreground/70 lg:flex"
        >
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative py-2 after:absolute after:bottom-[3px] after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:rounded-full after:bg-primary after:origin-left after:transition-transform after:duration-180 after:ease-[var(--ease-out)] hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions — far right */}
        <div className="nav-actions ml-auto flex items-center gap-1">
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
          <Button asChild className="btn btn-primary hidden h-11 min-h-[44px] whitespace-nowrap rounded-[14px] bg-[#33635a] px-4 text-[14px] font-extrabold text-white shadow-[0_10px_24px_rgba(51,99,90,0.2)] hover:bg-[#254d46] hover:shadow-[0_14px_30px_rgba(51,99,90,0.24)] lg:inline-flex">
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
                <Image
                  src="/logo.png"
                  alt=""
                  aria-hidden
                  width={28}
                  height={28}
                  className="size-7 rounded-md shadow-[0_4px_10px_rgba(51,99,90,0.22)]"
                />
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
