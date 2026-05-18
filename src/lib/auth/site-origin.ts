import { headers } from "next/headers";

/**
 * Returns the origin (scheme://host) of the current request when called inside
 * a server action or RSC. Falls back to NEXT_PUBLIC_SITE_URL when headers are
 * unavailable (e.g. cron jobs, background tasks).
 *
 * Use this for building Supabase `redirectTo` URLs — magic links must match
 * the host the user is actually on, otherwise localhost users get redirected
 * to production and vice versa.
 */
/**
 * Returns the origin used for the **client portal**, e.g.
 * `https://client.hulabe.com`. Always points at the client subdomain even
 * when called from `admin.hulabe.com` — needed because magic-link callbacks
 * for /client routes must land on the client subdomain, otherwise the
 * /client/setup-password route won't exist on the current host.
 *
 * Falls back to `${siteOrigin replacing leading www.}/client` only as a last
 * resort if no NEXT_PUBLIC_CLIENT_URL is set.
 */
export function getClientPortalOrigin(): string {
  return process.env.NEXT_PUBLIC_CLIENT_URL ?? "https://client.hulabe.com";
}

/**
 * Returns the origin used for the **admin** UI, e.g. `https://admin.hulabe.com`.
 * Use for magic-link callbacks targeting /admin routes when the user is
 * currently on a different subdomain.
 */
export function getAdminOrigin(): string {
  return process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.hulabe.com";
}

export async function getSiteOrigin(): Promise<string> {
  try {
    const h = await headers();
    // Prefer the forwarded host (Vercel / proxy). Fall back to host header.
    const forwardedHost = h.get("x-forwarded-host");
    const host = forwardedHost ?? h.get("host");
    if (host) {
      const forwardedProto = h.get("x-forwarded-proto");
      const proto =
        forwardedProto ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws outside of request scope — fall through to env var.
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com";
}
