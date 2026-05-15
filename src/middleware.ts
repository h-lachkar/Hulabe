import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? "admin.hulabe.com";
const CLIENT_HOST = process.env.NEXT_PUBLIC_CLIENT_HOST ?? "client.hulabe.com";

function getHost(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? ""
  ).toLowerCase();
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = getHost(req);
  const isAdminSubdomain = host === ADMIN_HOST;
  const isClientSubdomain = host === CLIENT_HOST;

  /* ------------- Subdomain double-prefix redirect ------------- */
  // Visitors on admin.hulabe.com/admin/* → redirect to admin.hulabe.com/* (without `/admin`).
  // Same for client.hulabe.com/client/*.
  if (isAdminSubdomain && pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/admin/, "") || "/";
    return NextResponse.redirect(url, 308);
  }
  if (isClientSubdomain && pathname.startsWith("/client")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/client/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  // After the rewrite in next.config.mjs, requests on admin.hulabe.com/* are
  // internally served as /admin/*. We then run our usual /admin gate below.

  /* ----------------------------- /admin gate ----------------------------- */
  if (pathname.startsWith("/admin")) {
    const { supabaseResponse, user } = await updateSession(req);
    const isLoginRoute =
      pathname === "/admin/login" || pathname === "/admin/setup-password";
    if (isLoginRoute) return supabaseResponse;

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return supabaseResponse;
  }

  /* ----------------------------- /client gate ---------------------------- */
  if (pathname.startsWith("/client")) {
    const { supabaseResponse, user } = await updateSession(req);
    const isLoginRoute =
      pathname === "/client/login" || pathname === "/client/setup-password";
    if (isLoginRoute) return supabaseResponse;

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/client/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return supabaseResponse;
  }

  /* ----------------------------- /auth callback -------------------------- */
  if (pathname.startsWith("/auth")) {
    const { supabaseResponse } = await updateSession(req);
    return supabaseResponse;
  }

  /* ----------------------------- Marketing ------------------------------- */
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
