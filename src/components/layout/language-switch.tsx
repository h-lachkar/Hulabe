"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckIcon,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/routing";
import { track } from "@/components/posthog-provider";

const LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export function LanguageSwitch() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    if (next === locale) return;
    track("language_changed", { from: locale, to: next });
    startTransition(async () => {
      const fd = new FormData();
      fd.append("locale", next);
      await setLocale(fd);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("language")}
          disabled={isPending}
          className="font-mono uppercase text-xs tracking-wider text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-3.5 w-3.5" />
          {locale}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => onSelect(l)}
            className="justify-between"
          >
            <span>{LABELS[l]}</span>
            {l === locale && <DropdownMenuCheckIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
