import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Penjaga rute guru (konvensi `proxy` di Next 16).
 *
 * Session di-refresh di sini supaya Server Component selalu membaca cookie
 * yang sudah valid, dan `/dashboard/*` hanya bisa dibuka oleh pengguna yang
 * sudah masuk (PRD Bab 5).
 */
export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const { pathname, search } = request.nextUrl;

  if (!userId && pathname.startsWith("/dashboard")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/masuk";
    redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (userId && pathname === "/masuk") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/masuk"],
};