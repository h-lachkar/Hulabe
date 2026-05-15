import { useTranslations } from "next-intl";
import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const ts = useTranslations("services.items");
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-bg">
      {/* Tagline strip */}
      <div className="border-b border-border bg-surface-2/40">
        <div className="container-page flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="auto" className="h-7 w-auto" />
            <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
            <span className="hidden text-sm text-muted-foreground sm:inline">{t("tagline")}</span>
          </div>
          <a
            href="mailto:support@hulabe.com"
            className="rounded-md font-mono text-xs uppercase tracking-wider text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            support@hulabe.com
          </a>
        </div>
      </div>

      <div className="container-page py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8 lg:gap-12">
          <div className="md:col-span-4">
            <p className="max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
            <p className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden />
              SHIPPING SINCE 2026.
            </p>
          </div>

          <nav className="md:col-span-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {t("services")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#services" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {ts("vitrine.title")}
                </a>
              </li>
              <li>
                <a href="#services" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {ts("ecommerce.title")}
                </a>
              </li>
              <li>
                <a href="#services" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {ts("saas.title")}
                </a>
              </li>
              <li>
                <a href="#services" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {ts("mobile.title")}
                </a>
              </li>
            </ul>
          </nav>

          <nav className="md:col-span-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {t("company")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#process" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {tn("process")}
                </a>
              </li>
              <li>
                <a href="#cases" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {tn("cases")}
                </a>
              </li>
              <li>
                <a href="#faq" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {tn("faq")}
                </a>
              </li>
              <li>
                <a href="#contact" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {tn("contact")}
                </a>
              </li>
            </ul>
          </nav>

          <nav className="md:col-span-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {t("legal")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/legal/privacy" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="rounded text-foreground hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="font-mono">
            © {year} Hulabe. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
