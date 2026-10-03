"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, FileCheck2, GraduationCap, Sparkles, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { AppNotification, NotificationType } from "@/lib/dummy/types";

const ICONS: Record<NotificationType, typeof Bell> = {
  ai_done: Sparkles,
  review: FileCheck2,
  session: GraduationCap,
  profile: UserCog,
  system: Bell,
};

const TYPE_LABEL: Record<NotificationType, string> = {
  ai_done: "AI selesai",
  review: "Menunggu review",
  session: "Sesi siswa",
  profile: "Profil siswa",
  system: "Sistem",
};

function formatWaktu(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: AppNotification[];
}) {
  const [items, setItems] = React.useState(initialNotifications.slice(0, 30));
  const unread = items.filter((n) => !n.isRead).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0
              ? `Notifikasi, ${unread} belum dibaca`
              : "Notifikasi, semua sudah dibaca"
          }
        >
          <Bell />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifikasi</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <CheckCheck className="size-4" aria-hidden />
            Tandai dibaca
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Belum ada notifikasi. Notifikasi materi, review, dan sesi siswa
              akan muncul di sini.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => {
                const Icon = ICONS[item.type];
                return (
                  <li key={item.id}>
                    <Link
                      href={item.link}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent"
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-foreground">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={`text-sm leading-snug ${item.isRead ? "font-medium" : "font-semibold"}`}
                          >
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <Badge variant="secondary" className="shrink-0">
                              Baru
                            </Badge>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {item.body}
                        </span>
                        <span className="mt-1.5 block text-xs text-muted-foreground">
                          {TYPE_LABEL[item.type]}
                          <span aria-hidden> / </span>
                          {formatWaktu(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}