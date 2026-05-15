import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? "admin.hulabe.com";
const CLIENT_HOST = process.env.NEXT_PUBLIC_CLIENT_HOST ?? "client.hulabe.com";

function getHost(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    ""
  ).toLowerCase();
}

// Paths that should pass through untouched on any host (Next internals,
// API routes, the shared auth callback, sitemap/robots/llms, etc.)
function isInternalPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vercel/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/ai.txt"
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = getHost(req);
  const isAdminSubdomain = host === ADMIN_HOST;
  const isClientSubdomain = host === CLIENT_HOST;
  const onSubdomain = isAdminSubdomain || isClientSubdomain;

  /* ------- 1. Subdomain rewrites (replace next.config.mjs rewrites) ------ */
  if (onSubdomain && !isInternalPath(pathname)) {
    const prefix = isAdminSubdomain ? "/admin" : "/client";

    // Strip double prefix: admin.hulabe.com/admin/x → admin.hulabe.com/x (308)
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.slice(prefix.length) || "/";
      return NextResponse.redirect(url, 308);
    }

    // Internal rewrite: admin.hulabe.com/login → /admin/login (no client URL change)
    const rewritten = req.nextUrl.clone();
    rewritten.pathname = prefix + (pathname === "/" ? "" : pathname);

    // Pass to the gates below by re-running the logic with the rewritten path
    return await gateAndRewrite(req, rewritten);
  }

  /* ----- 2. Direct path-based access on the parent domain (no subdomain) -- */
  return await gate(req);
}

/**
 * After a subdomain rewrite, we need to apply the same auth/intl gates as the
 * non-subdomain path. We synthesize a Request on the rewritten path so
 * updateSession() builds cookies correctly, then return NextResponse.rewrite()
 * pointing to the internal path.
 */
async function gateAndRewrite(originalReq: NextRequest, rewritten: URL) {
  const pathname = rewritten.pathname;

  /* /admin gate */
  if (pathname.startsWith("/admin")) {
    const { supabaseResponse, user } = await updateSession(originalReq);
    const isLoginRoute =
      pathname === "/admin/login" || pathname === "/admin/setup-password";

    if (!isLoginRoute && !user) {
      const url = originalReq.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Internal rewrite so Next serves /admin/<x> while the URL stays /<x>
    const res = NextResponse.rewrite(rewritten, { request: originalReq });
    // Re-apply cookies from supabaseResponse
    supabaseResponse.cookies.getAll().forEach((c) => {
      res.cookies.set(c.name, c.value, c);
    });
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  /* /client gate */
  if (pathname.startsWith("/client")) {
    const { supabaseResponse, user } = await updateSession(originalReq);
    const isLoginRoute =
      pathname === "/client/login" || pathname === "/client/setup-password";

    if (!isLoginRoute && !user) {
      const url = originalReq.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    const res = NextResponse.rewrite(rewritten, { request: originalReq });
    supabaseResponse.cookies.getAll().forEach((c) => {
      res.cookies.set(c.name, c.value, c);
    });
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Fallback (shouldn't hit): just rewrite
  return NextResponse.rewrite(rewritten, { request: originalReq });
}

/**
 * Same auth gates but for direct path-based access (hulabe.com/admin/*,
 * hulabe.com/client/*). No URL rewrite — Next matches the path natively.
 */
async function gate(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  if (pathname.startsWith("/auth")) {
    const { supabaseResponse } = await updateSession(req);
    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|_vercel/|.*\\..*).*)"],
};
