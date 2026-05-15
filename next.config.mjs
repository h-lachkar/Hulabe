import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const CLIENT_HOST = process.env.NEXT_PUBLIC_CLIENT_HOST ?? 'client.hulabe.com';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // client.hulabe.com/<anything> → /client/<anything>
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
