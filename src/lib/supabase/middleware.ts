import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Klien Supabase khusus middleware: membaca cookie dari request dan menulis
 * cookie yang diperbarui ke response, supaya session di-refresh sebelum
 * halaman berikutnya dirender.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const cookieHeader = request.headers.get("cookie") ?? "";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieHeader
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              const index = part.indexOf("=");
              return {
                name: index === -1 ? part : part.slice(0, index),
                value:
                  index === -1
                    ? ""
                    : decodeURIComponent(part.slice(index + 1)),
              };
            });
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return { supabase, response };
}