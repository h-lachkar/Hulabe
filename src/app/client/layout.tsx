import type { Metadata } from "next";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import "@/app/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hulabe.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.client");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

/**
 * Bare client layout — only html, body, fonts, next-intl provider.
 * The ClientShell wraps only routes inside (shell) — login and setup-password
 * are intentionally out of the shell.
 */
export default async function ClientRootLayout({
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
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
