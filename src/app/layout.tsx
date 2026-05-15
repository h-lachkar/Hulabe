import type { Metadata } from "next";

// This root layout exists only to satisfy Next.js when sub-trees (marketing,
// admin, client) provide their own <html>/<body> in their nested layouts.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
