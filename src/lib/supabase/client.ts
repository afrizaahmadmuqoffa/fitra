"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Klien Supabase untuk komponen browser (form login, Register, tombol Google). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}