import type { Metadata } from "next";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";
import { ClientShell } from "@/components/client/client-shell";
import { getClientUser } from "@/lib/client/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.client");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getClientUser();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {user ? (
            <ClientShell userEmail={user.email ?? ""}>{children}</ClientShell>
          ) : (
            children
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
