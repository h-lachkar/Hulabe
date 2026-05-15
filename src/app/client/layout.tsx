import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";
import { ClientShell } from "@/components/client/client-shell";
import { getClientUser } from "@/lib/client/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Espace client · Hulabe",
  robots: { index: false, follow: false },
};

export default async function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getClientUser();

  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-foreground">
        {user ? (
          <ClientShell userEmail={user.email ?? ""}>{children}</ClientShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
