import type { Metadata } from "next";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/admin/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.admin");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {ctx ? (
            <AdminShell
              userEmail={ctx.admin.email}
              userName={ctx.admin.name}
              userRole={ctx.admin.role}
            >
              {children}
            </AdminShell>
          ) : (
            children
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
