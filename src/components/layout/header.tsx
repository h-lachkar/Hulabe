"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#services", key: "services" as const },
  { href: "#process", key: "process" as const },
  { href: "#cases", key: "cases" as const },
  { href: "#faq", key: "faq" as const },
  { href: "#contact", key: "contact" as const },
];

export function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors",
        scrolled
          ? "border-b border-border bg-bg/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div
        className={cn(
          "container-page flex items-center justify-between gap-4 transition-[height]",
          scrolled ? "h-16" : "h-20",
        )}
      >
        <Link
          href="/"
          className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          aria-label="Hulabe"
        >
          <Logo
            variant="dark"
            priority
            className={cn(
              "w-auto transition-[height] duration-200",
              scrolled ? "h-9" : "h-11 sm:h-12",
            )}
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="#simulator">{t("cta")}</a>
          </Button>
          <button
            type="button"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-surface-2"
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? tc("closeMenu") : tc("openMenu")}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-bg">
          <nav className="container-page flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base text-foreground hover:bg-surface-2"
              >
                {t(item.key)}
              </a>
            ))}
            <Button asChild size="lg" className="mt-2">
              <a href="#simulator" onClick={() => setOpen(false)}>
                {t("cta")}
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
