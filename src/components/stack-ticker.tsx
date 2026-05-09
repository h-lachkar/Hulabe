"use client";

const ITEMS = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "Stripe",
  "Resend",
  "Vercel",
  "Prisma",
  "shadcn/ui",
  "React Native",
  "Expo",
  "Shopify",
  "Hydrogen",
  "PostgreSQL",
  "Cloudflare",
  "Framer Motion",
];

export function StackTicker() {
  return (
    <div
      className="relative w-full overflow-hidden border-y border-border bg-surface-2/30 py-5"
      aria-hidden
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />

      <div className="flex w-max motion-safe:animate-[ticker_50s_linear_infinite]">
        <Row />
        <Row />
      </div>

      <style jsx>{`
        @keyframes ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function Row() {
  return (
    <ul className="flex shrink-0 items-center gap-10 px-5 font-mono text-sm uppercase tracking-wider text-muted-foreground">
      {ITEMS.map((item, i) => (
        <li key={`${item}-${i}`} className="flex items-center gap-10">
          <span className="text-foreground">{item}</span>
          <span className="text-lime" aria-hidden>
            ●
          </span>
        </li>
      ))}
    </ul>
  );
}
