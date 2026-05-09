"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { useRouter, usePathname, routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckIcon,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { track } from "@/components/posthog-provider";

const LABELS: Record<(typeof routing.locales)[number], string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: (typeof routing.locales)[number]) {
    if (next === locale) return;
    track("language_changed", { from: locale, to: next });
    startTransition(() => {
      router.replace(pathname, { locale: next });
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
        {routing.locales.map((l) => (
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
