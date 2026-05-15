import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Subdomain routing is handled in src/middleware.ts (Edge), not via
  // next.config.mjs rewrites — Vercel's rewrite + cache pipeline makes
  // partial rewrites (excluding /_next/* etc.) too fragile.
};

export default withNextIntl(nextConfig);
