import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/admin/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Admin · Hulabe",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();

  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-foreground">
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
      </body>
    </html>
  );
}
