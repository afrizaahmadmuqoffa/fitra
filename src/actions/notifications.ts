"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import { notifications } from "@/db/schema";
import type { ActionResult } from "./auth";

const fail = (message: string): ActionResult => ({ ok: false, message });

/** Tandai semua notifikasi sudah dibaca. */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, context.userId),
            eq(notifications.isRead, false),
          ),
        );
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Semua notifikasi ditandai sudah dibaca." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Notifikasi gagal diperbarui.",
    );
  }
}

/** Tandai satu notifikasi sudah dibaca. */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, context.userId),
          ),
        );
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Notifikasi ditandai sudah dibaca." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Notifikasi gagal diperbarui.",
    );
  }
}

/** Buat notifikasi internal (dipanggil sistem, bukan dari browser). */
export async function createNotificationAction(input: {
  title: string;
  body: string;
  type: string;
  link: string;
}): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx.insert(notifications).values({
        userId: context.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        link: input.link,
      });
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Notifikasi dibuat." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Notifikasi gagal dibuat.");
  }
}