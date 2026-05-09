// This root layout exists only to satisfy Next.js when pages outside [locale]
// are rendered (e.g. the global not-found). All real layout/metadata lives in
// src/app/[locale]/layout.tsx.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
