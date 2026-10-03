"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import { classes } from "@/db/schema";
import { classSchema } from "@/lib/validation";
import type { ActionResult } from "./auth";

const fail = (message: string): ActionResult => ({ ok: false, message });

export async function createClassAction(input: unknown): Promise<ActionResult> {
  const parsed = classSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data kelas belum lengkap.");
  }
  const values = parsed.data;

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx.insert(classes).values({
        teacherId: context.userId,
        name: values.name.trim(),
        subject: values.subject?.trim() || null,
        grade: values.grade?.trim() || null,
        description: values.description?.trim() || null,
        room: values.room?.trim() || null,
      });
    });

    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: `Kelas ${values.name} dibuat.` };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Kelas gagal dibuat.");
  }
}

export async function updateClassAction(input: {
  classId: string;
  values: unknown;
}): Promise<ActionResult> {
  const parsed = classSchema.safeParse(input.values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data kelas belum lengkap.");
  }
  const values = parsed.data;

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(classes)
        .set({
          name: values.name.trim(),
          subject: values.subject?.trim() || null,
          grade: values.grade?.trim() || null,
          description: values.description?.trim() || null,
          room: values.room?.trim() || null,
        })
        .where(eq(classes.id, input.classId));
    });

    revalidatePath(`/dashboard/kelas/${input.classId}`);
    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Kelas diperbarui." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Kelas gagal diperbarui.");
  }
}

export async function deleteClassAction(classId: string): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx.delete(classes).where(eq(classes.id, classId));
    });

    revalidatePath("/dashboard/kelas");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Kelas dihapus." };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Kelas gagal dihapus.");
  }
}