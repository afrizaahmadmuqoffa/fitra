import { cache } from "react";
import { eq } from "drizzle-orm";
import { withRlsDb, type AuthClaims } from "@/db/rls";
import { profiles } from "@/db/schema";
import type { ProfilePreferences } from "@/db/schema";
import type { TeacherProfile } from "@/db/types";
import { createSupabaseServerClient } from "./supabase/server";

export type AuthContext = {
  userId: string;
  email: string;
  claims: AuthClaims;
};

/**
 * Satu kali pembacaan session per request. `getClaims()` memverifikasi JWT
 * dengan JWKS Supabase; kalau gagal (mis. offline) kita jatuh ke `getUser()`
 * yang tetap memvalidasi token lewat server Auth.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!error && claims?.sub) {
      return {
        userId: claims.sub as string,
        email: (claims.email as string) ?? "",
        claims: { sub: claims.sub as string, email: claims.email as string },
      };
    }
  } catch {
    // jatuh ke getUser()
  }

  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user?.email) return null;
  return {
    userId: user.id,
    email: user.email,
    claims: { sub: user.id, email: user.email },
  };
});

export const requireAuthContext = async (): Promise<AuthContext> => {
  const context = await getAuthContext();
  if (!context) {
    throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  }
  return context;
};

function toTeacherProfile(row: typeof profiles.$inferSelect): TeacherProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    nickname: row.nickname ?? row.fullName.split(",")[0],
    role: row.role,
    schoolName: row.schoolName ?? "",
    city: row.city ?? "",
    subjects: row.subjects ?? [],
    photoUrl: row.avatarUrl ?? "",
  };
}

export async function getTeacherPreferences(): Promise<ProfilePreferences> {
  const context = await getAuthContext();
  if (!context) {
    return {
      notifyAiDone: true,
      notifyReview: true,
      notifySession: true,
      dailyDigest: false,
    };
  }
  const row = await withRlsDb(context.claims, async (tx) => {
    const [found] = await tx
      .select({ preferences: profiles.preferences })
      .from(profiles)
      .where(eq(profiles.id, context.userId))
      .limit(1);
    return found ?? null;
  });
  return (
    row?.preferences ?? {
      notifyAiDone: true,
      notifyReview: true,
      notifySession: true,
      dailyDigest: false,
    }
  );
}

/** Profil guru dari tabel `profiles` (RLS: id = auth.uid()). */
export const getTeacherProfile = cache(async (): Promise<TeacherProfile | null> => {
  const context = await getAuthContext();
  if (!context) return null;

  const row = await withRlsDb(context.claims, async (tx) => {
    const [found] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, context.userId))
      .limit(1);
    return found ?? null;
  });

  return row ? toTeacherProfile(row) : null;
});