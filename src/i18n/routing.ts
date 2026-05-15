/**
 * Hulabe uses a cookie-based locale strategy (no /en, /es URL segments).
 * - One canonical URL per page (no locale prefix)
 * - The active locale is read from the NEXT_LOCALE cookie (or Accept-Language fallback)
 * - Language switch via server action that sets the cookie + router.refresh()
 */

export const LOCALES = ["fr", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";
/** 1 year. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
