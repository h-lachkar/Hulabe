import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminUser } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin · Hulabe",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();

  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="min-h-screen bg-bg text-foreground">
        {user ? (
          <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
