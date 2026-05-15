import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const CLIENT_HOST = process.env.NEXT_PUBLIC_CLIENT_HOST ?? 'client.hulabe.com';
const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? 'admin.hulabe.com';

// We need to rewrite admin.hulabe.com/<x> → /admin/<x> EXCEPT for Next.js
// internal paths (_next/static, _next/data, _next/image), API routes, and
// the shared /auth/callback handler. Otherwise those assets 404 because they
// get rewritten too.
//
// next.js `rewrites()` doesn't support a single regex with negative lookahead
// in the `source`. The cleanest portable solution is to add catch-all rewrites
// that PROXY internal paths through unchanged (acts as an explicit allow-list).
//
// Order matters: more specific rules first. The internal paths match first
// and rewrite to themselves (= no-op), so the subdomain-prefix rewrite below
// never sees them.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    const passThroughOnSubdomain = (host) => [
      {
        source: '/_next/:path*',
        has: [{ type: 'host', value: host }],
        destination: '/_next/:path*',
      },
      {
        source: '/api/:path*',
        has: [{ type: 'host', value: host }],
        destination: '/api/:path*',
      },
      {
        source: '/auth/:path*',
        has: [{ type: 'host', value: host }],
        destination: '/auth/:path*',
      },
    ];

    return {
      beforeFiles: [
        // Allow-list: internal paths pass through untouched on both subdomains.
        ...passThroughOnSubdomain(ADMIN_HOST),
        ...passThroughOnSubdomain(CLIENT_HOST),

        // Subdomain rewrites: everything else gets prefixed.
        // admin.hulabe.com/<x> → /admin/<x>
        {
          source: '/:path*',
          has: [{ type: 'host', value: ADMIN_HOST }],
          destination: '/admin/:path*',
        },
        // client.hulabe.com/<x> → /client/<x>
        {
          source: '/:path*',
          has: [{ type: 'host', value: CLIENT_HOST }],
          destination: '/client/:path*',
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
