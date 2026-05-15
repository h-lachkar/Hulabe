"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckIcon,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { track } from "@/components/posthog-provider";

/**
 * Theme toggle dropdown: Light / Dark / System.
 *
 * Renders a stable placeholder until mounted to avoid hydration mismatch
 * (the active theme is only known on the client after next-themes resolves).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("common.theme");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = mounted ? theme ?? "system" : "dark";
  const visualTheme = mounted ? resolvedTheme ?? "dark" : "dark";

  function onSelect(next: "light" | "dark" | "system") {
    if (next === current) return;
    track("theme_changed", { from: current, to: next });
    setTheme(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("label")}
          className={`font-mono uppercase text-xs tracking-wider text-muted-foreground hover:text-foreground ${className ?? ""}`}
        >
          {/* Cross-fade sun ↔ moon. Both rendered, opacity swapped via class. */}
          <span className="relative inline-flex h-4 w-4 items-center justify-center">
            <Sun
              className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
                visualTheme === "light"
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-90 scale-50 opacity-0"
              }`}
            />
            <Moon
              className={`absolute h-3.5 w-3.5 transition-all duration-300 ${
                visualTheme === "dark"
                  ? "rotate-0 scale-100 opacity-100"
                  : "rotate-90 scale-50 opacity-0"
              }`}
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onSelect("light")} className="justify-between gap-6">
          <span className="inline-flex items-center gap-2">
            <Sun className="h-4 w-4" />
            {t("light")}
          </span>
          {current === "light" && <DropdownMenuCheckIcon />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect("dark")} className="justify-between gap-6">
          <span className="inline-flex items-center gap-2">
            <Moon className="h-4 w-4" />
            {t("dark")}
          </span>
          {current === "dark" && <DropdownMenuCheckIcon />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect("system")} className="justify-between gap-6">
          <span className="inline-flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {t("system")}
          </span>
          {current === "system" && <DropdownMenuCheckIcon />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
