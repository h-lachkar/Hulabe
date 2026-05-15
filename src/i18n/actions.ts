"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
} from "./routing";

/**
 * Set the user's preferred locale.
 * Called from the language switcher in the marketing header.
 */
export async function setLocale(formData: FormData) {
  const value = formData.get("locale");
  if (!isLocale(value)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false, // readable client-side if we ever need to
  });

  // Revalidate marketing layout so the next render uses the new messages.
  revalidatePath("/", "layout");
}
