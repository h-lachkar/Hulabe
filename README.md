# Hulabe

Landing page de l'agence Hulabe — Next.js 14 + TypeScript strict, multilangue (FR/EN/ES), avec un simulateur de prix multi-étapes qui capture des leads en base et envoie un email de confirmation.

## Stack

- **Next.js 14** (App Router) + **TypeScript** strict
- **Tailwind CSS** + composants shadcn/ui (style new-york, base neutral)
- **next-intl** pour FR / EN / ES, routing localisé `as-needed`
- **Prisma** + **Supabase Postgres** pour stocker les leads
- **Resend** pour les emails transactionnels
- **Zod** pour la validation côté serveur
- **react-hook-form** + **framer-motion**
- **Geist Sans / Geist Mono** via `geist`
- **pnpm** comme package manager
- Hébergement **Vercel**

## Commandes

```bash
pnpm install              # installe les deps + génère le client Prisma
pnpm dev                  # serveur de dev → http://localhost:3000
pnpm build                # build prod (lance prisma generate + next build)
pnpm start                # serveur prod
pnpm lint                 # ESLint
pnpm db:push              # push le schéma vers la DB (sans migration)
pnpm db:migrate           # crée et applique une migration
pnpm db:studio            # ouvre Prisma Studio
```

## Variables d'environnement

Copie `.env.example` vers `.env.local` puis remplis :

```
DATABASE_URL              # URL pooler Supabase (port 6543)
DIRECT_URL                # URL directe Supabase (port 5432) — pour migrations
RESEND_API_KEY            # API key Resend
RESEND_FROM_EMAIL         # ex: "Hulabe <hello@hulabe.com>" (domaine vérifié)
NOTIFICATION_EMAIL        # email qui reçoit les notifs de leads
NEXT_PUBLIC_SITE_URL      # URL prod, ex: https://hulabe.com
NEXT_PUBLIC_CAL_URL       # URL Cal.com / Calendly
```

## Structure

```
src/
├── app/
│   ├── [locale]/              # Pages localisées (FR par défaut)
│   │   ├── layout.tsx         # Header + Footer + intl provider
│   │   ├── page.tsx           # Landing
│   │   ├── simulator/         # Page dédiée /simulator
│   │   └── legal/             # /legal/privacy, /legal/terms
│   └── api/
│       ├── lead/route.ts      # POST formulaire de contact
│       └── simulator/route.ts # POST simulateur multi-étapes
├── components/
│   ├── ui/                    # shadcn/ui (button, card, input, …)
│   ├── layout/                # Header, Footer, LanguageSwitch
│   ├── sections/              # Hero, Services, Simulator, FAQ, …
│   └── logo.tsx
├── i18n/
│   ├── routing.ts / request.ts
│   └── messages/{fr,en,es}.json
├── lib/                       # prisma, resend, validations, pricing, rate-limit
├── types/
└── middleware.ts              # next-intl middleware

prisma/schema.prisma           # Lead + ServiceType + LeadStatus + LeadSource
public/                        # logos, icons, favicon
```

## Charte graphique

| Token       | Valeur     | Usage                          |
| ----------- | ---------- | ------------------------------ |
| `--bg`      | `#0A0A0A`  | Fond principal                  |
| `--surface` | `#141414`  | Cartes                          |
| `--surface-2` | `#1C1C1C` | Surfaces secondaires            |
| `--border`  | `#262626`  | Bordures                        |
| `--text`    | `#FAFAFA`  | Texte principal                 |
| `--muted`   | `#A1A1AA`  | Texte secondaire                |
| `--lime`    | `#A3E635`  | Accent principal (CTA, ".")     |
| `--lime-dark` | `#84CC16` | Hover lime                     |

Le lime ne dépasse jamais 10-15% de la surface visible — c'est un accent.

## Déploiement Vercel

1. Import du repo sur [vercel.com](https://vercel.com)
2. Add les env vars (cf. `.env.example`)
3. Build command : `pnpm build` (par défaut)
4. Avant le premier build : lance `pnpm db:push` localement pour créer le schéma sur Supabase

## Cas d'usage du simulateur

Le composant central, `src/components/sections/simulator.tsx`, gère :

1. Type de projet (6 services + Autre)
2. Fonctionnalités (10 cases à cocher)
3. Délai (4 options, modifie le prix)
4. Budget (5 ranges)
5. Coordonnées + RGPD
6. Résultat → fourchette calculée + lien Calendly

La logique de prix est dans `src/lib/pricing.ts`. Validation côté serveur dans `src/lib/validations.ts` (Zod) avant insert en base et envoi des emails.

## TODO côté humain

Voir le bas du fichier [SETUP.md](./SETUP.md).
