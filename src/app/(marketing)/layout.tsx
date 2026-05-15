import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { Locale } from "@/i18n/routing";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com";

const KEYWORDS: Record<Locale, string[]> = {
  fr: [
    "agence dev",
    "studio développement",
    "site vitrine",
    "site Next.js",
    "e-commerce Shopify",
    "MVP SaaS",
    "app mobile React Native",
    "Lovable migration",
    "freelance développeur Paris",
    "devis site web",
  ],
  es: [
    "estudio desarrollo",
    "web Next.js",
    "tienda Shopify",
    "MVP SaaS",
    "app móvil React Native",
    "migración Lovable",
    "presupuesto web",
  ],
  en: [
    "dev studio",
    "Next.js development",
    "Shopify development",
    "SaaS MVP",
    "React Native app",
    "Lovable to production",
    "marketing site quote",
  ],
};

const OG_LOCALE: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "meta" });
  const alternateLocales = (["fr", "en", "es"] as Locale[]).filter((l) => l !== locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: "%s — Hulabe",
    },
    description: t("description"),
    applicationName: "Hulabe",
    authors: [{ name: "Hulabe", url: SITE_URL }],
    creator: "Hulabe",
    publisher: "Hulabe",
    keywords: KEYWORDS[locale],
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: SITE_URL,
      siteName: "Hulabe",
      locale: OG_LOCALE[locale],
      alternateLocale: alternateLocales.map((l) => OG_LOCALE[l]),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      creator: "@hulabe",
    },
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
  ],
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg text-foreground">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <PostHogProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <Toaster />
            </PostHogProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
