import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ----------------------------- /admin gate ----------------------------- */
  if (pathname.startsWith("/admin")) {
    const { supabaseResponse, user } = await updateSession(req);
    const isLoginRoute = pathname === "/admin/login";
    if (isLoginRoute) return supabaseResponse;

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Note: AdminUser table check happens in each page via requireAdmin().
    // We can't query Prisma from edge middleware. This is fine — the page
    // gate is the source of truth.

    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return supabaseResponse;
  }

  /* ----------------------------- /client gate ---------------------------- */
  if (pathname.startsWith("/client")) {
    const { supabaseResponse, user } = await updateSession(req);
    const isLoginRoute = pathname === "/client/login";
    if (isLoginRoute) return supabaseResponse;

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/client/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    // Per-project ownership check happens at the page level.
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return supabaseResponse;
  }

  /* ----------------------------- /auth callback -------------------------- */
  if (pathname.startsWith("/auth")) {
    const { supabaseResponse } = await updateSession(req);
    return supabaseResponse;
  }

  /* ----------------------------- Marketing ------------------------------- */
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
