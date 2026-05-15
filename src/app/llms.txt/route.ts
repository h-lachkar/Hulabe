import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hulabe.com";

const CONTENT = `# Hulabe

> Studio de développement web et mobile (Paris / remote). Sites marketing, e-commerce, SaaS MVP, applications mobiles et migrations no-code livrés rapidement avec un code propre. Devis sous 24h, démarrage rapide, code à toi.

## What we do

Hulabe is a one-person dev studio specialized in shipping production-grade code fast. We package our work into 6 clearly-priced services with fixed timelines, so clients know exactly what to expect.

## Services

### Marketing site (Vitrine)
Professional Next.js marketing site shipped in 1-2 weeks. Includes CMS option, SEO, animations.
**Price: €800 – €2,500**
**Stack: Next.js, TypeScript, Tailwind CSS, Sanity/Notion CMS**

### E-commerce store
Shopify or custom Next.js + Stripe store shipped in 2-3 weeks. Multi-currency, subscriptions, integrations.
**Price: €1,500 – €5,000**
**Stack: Shopify Liquid, Hydrogen, Next.js, Stripe**

### Custom Shopify development
Shopify apps, custom Liquid themes, third-party integrations (ERP, CRM), Hydrogen headless front.
**Price: €500 – €3,000**
**Duration: 1-3 weeks**

### Lovable to production migration
Migration of a no-code MVP (Lovable, Bolt.new, Bubble, V0, Webflow + Memberstack) to a clean, scalable Next.js + Supabase code stack. Preserves data when needed.
**Price: €2,000 – €8,000**
**Duration: 2-4 weeks**

### SaaS MVP
Complete SaaS MVP: authentication, Stripe billing (one-time, subscription, or usage-based), admin dashboard, multi-tenant or B2C/B2B, API, in 4 to 8 weeks max.
**Price: €5,000 – €15,000**
**Stack: Next.js, TypeScript, Supabase, Stripe, Prisma, Vercel**

### Mobile application
iOS + Android app in React Native + Expo (single codebase). Push notifications, geolocation, in-app purchases, deep linking, App Store + Play Store submission included.
**Price: €4,000 – €12,000**
**Duration: 4-8 weeks**

## Process

1. **30-minute brief**. Free, no commitment. We understand your project, timeline, budget. You leave with a clear plan.
2. **Fixed quote**. Within 24 working hours. Scope, timeline, price. No hidden costs.
3. **Build**. Fast kickoff. Regular demos, direct contact with the team that codes.
4. **Ship**. Go live, training, documentation. 14 days of support included for tweaks.

## Pricing & payments

- 30% on signing, 30% mid-project, 40% on delivery
- Projects > €10k can be split into monthly sprints
- Indicative prices, final pricing locked during the 30-min brief based on exact scope

## Stack & technologies

**Web:** Next.js · TypeScript · Tailwind CSS · React · Supabase · Stripe · Prisma · PostgreSQL · Vercel · Resend · shadcn/ui · Framer Motion

**Mobile:** React Native · Expo · iOS · Android

**E-commerce:** Shopify · Liquid · Hydrogen · Stripe

## Who we work with

- **Founders solo / early-stage**, need an MVP fast, budget-conscious
- **Freelancers / consultants**, want a serious portfolio site that converts
- **SMBs / agencies**, need a reactive technical overflow partner
- **Lovable / no-code MVPs**, niche: bringing no-code MVPs into production code

We don't work with: large corporate accounts, slow committees, projects that demand 12-layer Gantt charts.

## Selected work

- **RektAds** ([rektads.com](https://rektads.com)). Meta ads analysis platform. Next.js + TypeScript + Tailwind. Scores creatives, detects fatigue, generates next winners.
- **BCN Immobilier** ([bcn-immobilier.com](https://bcn-immobilier.com)). Barcelona real estate agency. Multilingual site with property listings, services, processes.

## FAQ

**How long does it take to ship?** 1 to 8 weeks depending on the project. Fast kickoff after sign-off.

**Do you handle copy, content, and design?** Yes on demand. We can take care of copywriting and design, or work alongside your team and existing partners.

**Do I own the code?** Always. You get the Git repo, hosting account, service credentials. No lock-in.

**What stack do you use?** Web: Next.js, TypeScript, Tailwind, Supabase, Stripe, Vercel. Mobile: React Native + Expo. Shopify: Liquid + Hydrogen.

**How do you collaborate during the project?** Direct contact with the devs, regular demos, a preview environment that's always live. No committees.

**What happens after launch?** 14 days of support included for tweaks. After that you can sign a maintenance contract, or take over, it's your code.

## Contact

- **Email**: support@hulabe.com
- **Site**: [${SITE_URL}](${SITE_URL})
- **Languages**: French, English, Spanish

## Service area

Worldwide (remote). Based in Paris, France. Working hours France + flexible for time-zone-friendly clients.

## Important pages

- [Home](${SITE_URL})
- [Pricing simulator](${SITE_URL}/#simulator)
- [Services](${SITE_URL}/#services)
- [Process](${SITE_URL}/#process)
- [Case studies](${SITE_URL}/#cases)
- [FAQ](${SITE_URL}/#faq)
- [Contact](${SITE_URL}/#contact)
- [Privacy policy](${SITE_URL}/legal/privacy)
- [Terms of service](${SITE_URL}/legal/terms)

## Optional

- llms-full.txt: ${SITE_URL}/llms.txt
- Site map: ${SITE_URL}/sitemap.xml
`;

export async function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
