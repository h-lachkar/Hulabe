import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession, isAdminEmail } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin and /auth routes don't go through next-intl
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
    const { supabaseResponse, user } = await updateSession(req);

    // Allow login + auth callback unauthenticated
    const isLoginRoute = pathname === "/admin/login" || pathname.startsWith("/auth/");
    if (isLoginRoute) return supabaseResponse;

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (!isAdminEmail(user.email)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(url);
    }

    // Add no-index header on admin routes (defense in depth — sitemap excludes too)
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return supabaseResponse;
  }

  // Everything else (marketing landing) goes through next-intl
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
