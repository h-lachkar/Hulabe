import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "./routing";

function pickFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  // Parse "fr-FR,fr;q=0.9,en;q=0.8" and find the best match in our supported set.
  const candidates = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];
  for (const tag of candidates) {
    const short = tag.split("-")[0];
    if (isLocale(short)) return short;
  }
  return null;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale = DEFAULT_LOCALE;
  if (cookieLocale && isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    const fromHeader = pickFromAcceptLanguage(headerStore.get("accept-language"));
    if (fromHeader) locale = fromHeader;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

export { LOCALES };
