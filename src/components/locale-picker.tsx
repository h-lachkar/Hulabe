"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

const FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
};

/**
 * Locale picker for admin/client settings panels.
 * Click a tile → sets the NEXT_LOCALE cookie + refreshes the page so server
 * components re-render in the new language.
 */
export function LocalePicker() {
  const t = useTranslations("common");
  const current = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === current || pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("locale", next);
      await setLocale(fd);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t("language")}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {LOCALES.map((loc) => {
          const isCurrent = loc === current;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => pick(loc)}
              disabled={pending}
              aria-pressed={isCurrent}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-md border bg-surface-2 px-3 py-2.5 text-sm transition-colors",
                isCurrent
                  ? "border-lime/40 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                pending && "opacity-60",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{FLAGS[loc]}</span>
                <span>{LABELS[loc]}</span>
              </span>
              {isCurrent && <Check className="h-3.5 w-3.5 text-lime" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
