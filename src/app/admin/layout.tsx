import type { Metadata } from "next";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.admin");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Bare admin layout — only provides <html>, <body>, fonts, and the next-intl
 * client provider. The AdminShell (sidebar, nav) is applied only to routes
 * inside the (shell) route group.
 *
 * Login, setup-password, and any other "edge" admin routes live outside the
 * shell so the user can't navigate away while in those states.
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
