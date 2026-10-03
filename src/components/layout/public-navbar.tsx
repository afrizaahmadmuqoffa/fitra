"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants";
import { publicNav } from "@/lib/nav";

export function PublicNavbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 h-[72px] border-b transition-colors duration-300 ${
        scrolled
          ? "border-border bg-background/90 backdrop-blur-md"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-6 px-4 md:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-heading text-lg font-bold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground"
          >
            F
          </span>
          {APP_NAME}
        </Link>

        <nav aria-label="Navigasi utama" className="hidden flex-1 lg:block">
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

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              resolvedTheme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap"
            }
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/masuk">Masuk</Link>
          </Button>
          <Button asChild className="whitespace-nowrap">
            <Link href="/masuk">Daftar Gratis</Link>
          </Button>
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
            <SheetContent side="right" className="w-[min(22rem,88vw)]">
              <SheetTitle className="font-heading text-base">Menu</SheetTitle>
              <ul className="mt-6 space-y-1">
                {publicNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t pt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/masuk">Masuk</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}