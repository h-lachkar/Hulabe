"use client";

import { useLocale } from "next-intl";
import { getFormat } from "./format";

/**
 * Client-side hook returning locale-aware label maps and date/currency formatters.
 * For server components, call getFormat(await getLocale()) directly.
 */
export function useFormat() {
  const locale = useLocale();
  return getFormat(locale);
}
