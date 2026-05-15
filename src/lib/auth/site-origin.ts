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
