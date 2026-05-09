import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/components/posthog-provider";
import "@/app/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";
  const canonicalPath = locale === routing.defaultLocale ? "/" : `/${locale}`;

  // Localized OG locale codes
  const ogLocale =
    locale === "fr" ? "fr_FR" : locale === "es" ? "es_ES" : "en_US";
  const ogAlternates =
    locale === "fr"
      ? ["en_US", "es_ES"]
      : locale === "en"
        ? ["fr_FR", "es_ES"]
        : ["fr_FR", "en_US"];

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: "%s — Hulabe",
    },
    description: t("description"),
    applicationName: "Hulabe",
    authors: [{ name: "Hulabe", url: siteUrl }],
    creator: "Hulabe",
    publisher: "Hulabe",
    keywords:
      locale === "fr"
        ? [
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
          ]
        : locale === "es"
          ? [
              "estudio desarrollo",
              "web Next.js",
              "tienda Shopify",
              "MVP SaaS",
              "app móvil React Native",
              "migración Lovable",
              "presupuesto web",
            ]
          : [
              "dev studio",
              "Next.js development",
              "Shopify development",
              "SaaS MVP",
              "React Native app",
              "Lovable to production",
              "marketing site quote",
            ],
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: undefined,
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${siteUrl}${canonicalPath}`,
      siteName: "Hulabe",
      locale: ogLocale,
      alternateLocale: ogAlternates,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      creator: "@hulabe",
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, l === routing.defaultLocale ? "/" : `/${l}`]),
        ),
        "x-default": "/",
      },
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
  themeColor: "#0A0A0A",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg text-foreground">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PostHogProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <Toaster />
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
