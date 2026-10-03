"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import type { AppNotification } from "@/lib/dummy/types";
import type { TeacherProfile } from "@/lib/dummy/types";

const SEGMENT_LABEL: Record<string, string> = {
  dashboard: "Dasbor",
  siswa: "Siswa",
  baru: "Siswa Baru",
  profil: "Profil Belajar",
  kelas: "Kelas",
qr: "QR Code",
  materi: "Materi",
  adaptasi: "Adaptasi",
  progres: "Progres",
  ppi: "PPI",
  pengaturan: "Pengaturan",
};

function segmentLabel(segment: string, parent?: string): string | undefined {
  if (segment === "baru") {
    return parent === "materi" ? "Tambah Materi" : "Siswa Baru";
  }
  return SEGMENT_LABEL[segment];
}

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(1);
  return segments.map((segment, i) => ({
    label:
      segmentLabel(segment, segments[i - 1]) ??
      (segment.startsWith("stu-") || segment.startsWith("mat-") || segment.startsWith("ppi-")
        ? segment
        : segment.charAt(0).toUpperCase() + segment.slice(1)),
    href: `/dashboard/${segments.slice(0, i + 1).join("/")}`,
    current: i === segments.length - 1,
  }));
}

export function DashboardHeader({
  teacher,
  notifications,
}: {
  teacher: TeacherProfile;
  notifications: AppNotification[];
}) {
  const crumbs = useBreadcrumbs();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const initials = teacher.fullName
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-md md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu Guru"
          >

            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(17rem,84vw)] p-0">
          <SheetTitle className="sr-only">Menu Guru</SheetTitle>
          <DashboardSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          <li>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dasbor</Link>
            </BreadcrumbLink>
          </li>
          {crumbs.map((crumb) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.current ? (
                  <BreadcrumbPage className="max-w-[14rem] truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <NotificationBell initialNotifications={notifications} />

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2">
            <Avatar className="size-8">
              <AvatarImage src={teacher.photoUrl} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">
              {teacher.nickname}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <span className="block text-sm font-semibold">{teacher.fullName}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {teacher.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/pengaturan">Pengaturan akun</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/panduan">Panduan penggunaan</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => router.push("/")}>
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MobileBottomNav />
    </header>
  );
}
