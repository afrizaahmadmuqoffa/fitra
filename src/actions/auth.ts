"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/auth";
import { withRlsDb } from "@/db/rls";
import { profiles } from "@/db/schema";
import { accountSchema } from "@/lib/validation";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const fail = (message: string): ActionResult => ({ ok: false, message });

export async function signOutAction(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) return fail("Gagal keluar dari sesi. Silakan coba lagi.");
  revalidatePath("/", "layout");
  return { ok: true, message: "Sesi ditutup." };
}

/** Simpan profil guru dari halaman /dashboard/pengaturan. */
export async function updateTeacherProfileAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data profil belum lengkap.");
  }

  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(profiles)
        .set({
          fullName: parsed.data.fullName,
          schoolName: parsed.data.schoolName,
          city: parsed.data.city,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(profiles.id, context.userId));
    });

    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({
      email: parsed.data.email,
      data: {
        full_name: parsed.data.fullName,
        school_name: parsed.data.schoolName,
        city: parsed.data.city,
      },
    });

    revalidatePath("/dashboard/pengaturan");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Profil guru tersimpan." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Profil gagal disimpan.",
    );
  }
}

/** Ubah kata sandi akun guru. */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  if (input.newPassword.length < 8) {
    return fail("Kata sandi baru minimal 8 karakter.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user?.email) {
    return fail("Sesi tidak ditemukan. Silakan masuk kembali.");
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (error) return fail(error.message);

  return { ok: true, message: "Kata sandi berhasil diganti." };
}

/** Simpan preferensi notifikasi in-app dan ringkasan harian. */
export async function updateNotificationPreferencesAction(input: {
  notifyAiDone: boolean;
  notifyReview: boolean;
  notifySession: boolean;
  dailyDigest: boolean;
}): Promise<ActionResult> {
  try {
    const context = await requireAuthContext();
    await withRlsDb(context.claims, async (tx) => {
      await tx
        .update(profiles)
        .set({ preferences: input, updatedAt: new Date().toISOString() })
        .where(eq(profiles.id, context.userId));
    });
    revalidatePath("/dashboard/pengaturan");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Preferensi notifikasi tersimpan." };
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Preferensi gagal disimpan.",
    );
  }
}