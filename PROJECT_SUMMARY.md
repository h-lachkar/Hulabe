# Hulabe — Project Build Summary

A comprehensive log of everything built and shipped in this codebase, in
chronological order of work. Use this as a quick reference for what exists,
where it lives, and how the moving parts fit together.

---

## Stack

- **Framework**: Next.js 14.2 (App Router), TypeScript strict
- **UI**: Tailwind CSS + custom design system, shadcn-style primitives,
  Framer Motion, Geist Sans + Geist Mono
- **i18n**: `next-intl` 3.26, cookie-based (`NEXT_LOCALE`), no URL prefix.
  Locales: `fr`, `en` (default), `es`
- **DB**: Supabase Postgres + Prisma ORM
- **Auth**: Supabase Auth (password + magic-link recovery flows)
- **Email**: Resend (transactional + admin-initiated templates)
- **Storage**: Supabase Storage (`deliverables` bucket)
- **PDF**: `@react-pdf/renderer` server-side
- **Analytics**: PostHog (marketing landing only; admin/client portals are
  deliberately untracked)
- **AI**: Anthropic SDK (Claude Haiku 4.5 for lead scoring)
- **Theming**: `next-themes` with `attribute="class"` (light + dark + system)
- **Hosting**: Vercel, three domains:
  - `hulabe.com` (apex, 301 → www)
  - `www.hulabe.com` (canonical marketing site)
  - `admin.hulabe.com` (admin portal — same Next app, subdomain rewrite via
    middleware)
  - `client.hulabe.com` (client portal — same Next app, subdomain rewrite)

---

## Architecture overview

```
src/app/
├── (marketing)/        Public landing site (one URL per route, locale via cookie)
├── admin/              Admin portal, served on admin.hulabe.com
│   ├── (shell)/        Authenticated routes wrapped in AdminShell sidebar
│   ├── login/          Public sign-in
│   ├── setup-password/ Forced password set on first invite
│   └── layout.tsx      Bare html/body + ThemeProvider + i18n provider
├── client/             Client portal, served on client.hulabe.com
│   ├── (shell)/        Authenticated routes wrapped in ClientShell topbar
│   ├── login/
│   ├── setup-password/
│   └── layout.tsx
├── auth/               Shared OAuth callback page (parses hash → session)
├── api/                Public + protected API routes
└── layout.tsx          Root layout (empty — subtrees own their html/body)
```

Subdomain routing is handled entirely in `src/middleware.ts` (Edge runtime).
No `next.config.mjs` rewrites — those broke static asset serving in production.

---

## Features shipped (in build order)

### 1. Marketing landing page

- Hero with theme-aware title, lime accent dot, "WhatsIncluded" card
  (replaced the original "Terminal" mock — too geeky)
- Six service packages with outcome-focused taglines (Vitrine, E-commerce,
  Shopify, Lovable-to-app, SaaS MVP, Mobile app)
- Four-step Process section
- Case studies (RektAds, BCN Immobilier, "Your project" coming-soon placeholder)
- Simulator (multi-step quote estimator) with per-service question flows
- FAQ accordion
- Contact form (sends lead to DB, fires welcome email via Resend, AI lead
  score via Anthropic)

**Content sanitization passes:**
- Removed every Slack / WhatsApp mention (replaced with "direct contact, no
  middlemen")
- Removed every "7 days" / "7 jours" / "7 días" kickoff timeline (replaced
  with "fast kickoff" / "démarrage rapide" / "arranque rápido")
- Em-dash cleanup: all `—` in user-visible strings replaced with periods or
  commas (felt too AI-generated)

### 2. Light + dark theme

- Full `next-themes` integration with `attribute="class"`, cookie-persisted
- Tokens defined in `src/app/globals.css` under `:root` (dark default) +
  `.light` (overrides)
- Theme-aware utilities:
  - `bg-grid` with light/dark line colors
  - `hero-halo-bg` / `hero-halo-bg-soft` (lime radial gradients adjusted per
    theme)
  - `card-hover` with theme-aware drop shadow
- `Logo` component auto-picks `/logo-dark.svg` or `/logo-light.svg`
- `ThemeToggle` dropdown (sun/moon icons, cross-fade animation) wired into
  marketing header, admin shell, client shell
- Tailwind config uses `hsl(var(--...))` everywhere — no hardcoded hex outside
  globals.css
- Lime accent darkens to `#65A30D` in light mode for AA contrast on white
- Admin role badges, status pills, form inputs all theme-tested
- `meta[name="theme-color"]` is array-based (dark/light per `prefers-color-scheme`)

### 3. PostHog gating

- PostHog initialized only inside `src/app/(marketing)/layout.tsx`
- Admin + client portals + auth routes do **not** load any analytics scripts
- `track()` helper is now a no-op when PostHog isn't initialized, so shared
  components (like `ThemeToggle`) can call it safely from any context

### 4. Admin portal (CRM core)

**Auth gates:**
- `requireAdmin()` / `requireMutator()` / `requireOwner()` in
  `src/lib/admin/auth.ts`
- Cached per React render tree via `react.cache` to avoid duplicate
  Supabase getUser() calls per nav

**Routes:**
- `/admin` — Dashboard with KPIs + recent activity
- `/admin/leads` (+ `[id]`) — Lead inbox with AI score panel, status workflow
- `/admin/projects` (+ `[id]`) — Kanban board by status, full project detail
- `/admin/clients` (+ `[id]`, `/new`) — Client user management
- `/admin/invoices` (+ `[id]`, `/new`, `[id]/pdf`) — Invoice CRUD + PDF
- `/admin/team` — Internal team management (OWNER only)
- `/admin/support` — Support window + ticket overview
- `/admin/settings` — Personal settings, locale + theme
- `/admin/deliverables/[id]/file` — Signed-URL redirect for file downloads

**Performance fixes:**
- Added `take: 50/100` on every `findMany()` to bound payloads
- `prefetch={true}` on every nav `<Link>` (sidebar + mobile bottom-nav)
- Parallelized queries with `Promise.all()` everywhere
- React `cache()` wrapping resolved auth lookups to cut Supabase round-trips
  in half

### 5. Client portal

- `/client` — Project list for the logged-in user
- `/client/projects/[id]` — Project view with deliverables, updates, support
- `/client/support` — Open / view tickets
- `/client/settings` — Locale + theme
- `/client/deliverables/[id]/file` — Signed-URL redirect (verifies the user
  owns or is assigned to the project)

### 6. Invoices (full CRUD + PDF)

**Schema:**
- `Invoice`: subtotal/tax/grand total in cents, client snapshot (name/email/
  address/VAT), currency, dueAt, status
- `InvoiceLine`: description + quantity + unitPriceCents + position
- `InvoiceCounter`: per-year atomic counter (`2026-0001`, `2026-0002`…)

**UI:**
- `/admin/invoices/new` — Project picker auto-fills client info, dynamic line
  items, live total + tax calculation
- `/admin/invoices/[id]` — Edit form + status workflow (DRAFT → SENT → PAID,
  + CANCELLED + OVERDUE)
- `/admin/invoices/[id]/pdf` — On-demand server-rendered PDF via
  `@react-pdf/renderer`. Template lives in `src/lib/invoice/pdf.tsx`.

### 7. Deliverables (enriched)

- Kinds: `TEXT`, `LINK`, `REPO`, `DEPLOYMENT`, `DESIGN`, `DOC`, `FILE`
- `FILE` kind triggers an upload to Supabase Storage (`deliverables` bucket,
  50MB cap), stores `fileKey` + `fileName` + `fileSize` + `fileContentType`
- Toggle `visibleToClient` (eye/eye-off) without reload
- Delete cleans up the underlying storage object
- When `visibleToClient=true`, an email auto-fires to the lead's email
- Client portal serves files via `/client/deliverables/[id]/file` → short-
  lived signed URL (1h TTL)

**Bucket setup is documented in `SUPABASE_STORAGE.md` at repo root.**

### 8. Email system

- Existing transactional emails (lead confirmation, admin/client invites,
  project updates, support replies, deliverable notifications)
- New admin-initiated templates: `WELCOME`, `QUOTE_SENT`, `PROJECT_UPDATE`,
  `FEEDBACK_REQUEST`, `CUSTOM`
- `<EmailSendButton>` component wired into lead detail + project detail
  sidebars. Opens an inline form with template picker, optional subject/body
  overrides, optional CTA URL+label. Logged to project activity timeline.

### 9. KPI dashboard

Four extra stat cards on `/admin`:
- Paid revenue MTD (with previous-month comparison)
- Outstanding (with overdue split)
- Conversion rate (won leads / total leads MTD)
- Velocity (avg days from `startedAt` → `shippedAt`, 30-day rolling)

All queries parallelized in `src/lib/admin/kpi.ts`. Single round-trip cost.

### 10. Many-to-many unification (major refactor)

Replaced 4 tables (`AdminUser`, `ClientUser`, `ProjectClient`, `ProjectAdmin`)
with 2 tables:

- **`User`**: single source of truth, role enum `OWNER | ADMIN | VIEWER |
  CLIENT`, plus `accessScope: ALL | ASSIGNED` for scoped admins
- **`ProjectMember`**: explicit `projectId + userId` link, replaces both
  client-portal access and admin-assignment tables

**Migration was non-destructive:**
- `scripts/migrate-unify-users.ts` renamed `AdminUser → User`, added enum
  values (`CLIENT`), added nullable client-only columns (`company`, `phone`,
  `notes`), dropped the empty new tables, recreated `ProjectMember`.
  The existing OWNER seed was preserved.
- `scripts/fix-user-constraints.ts` renamed leftover PK/UNIQUE/FK constraints
  from `AdminUser_*` to `User_*` so `prisma db push` could verify the
  no-diff state.

**Feature unlocked:**
- A project can have multiple CLIENT users (founder + ops + designer)
- A CLIENT user can access multiple projects
- An ADMIN/VIEWER with `accessScope = ASSIGNED` only sees their assigned
  projects (in list, detail, and dashboard KPIs). OWNER always sees all.
- UI: `<AssignmentList>` reused on project detail (sidebar) — one section for
  clients, one for admins (OWNER only). `<ClientProjectsList>` on client
  detail page (reverse direction). Team page exposes a per-admin
  `accessScope` dropdown.

### 11. Bug fixes during testing

- **Resend invite failed silently for already-invited clients.** Fixed by
  trying `type=invite` first, falling back to `type=recovery` if Supabase
  Auth already has the user. Same pattern is used for admin invites.
  Helper: `generateClientMagicLink()` in `src/lib/admin/client-actions.ts`.

- **Client magic-links landed on `admin.hulabe.com/client/setup-password`
  (404).** Root cause: the admin clicking "Resend" was on
  `admin.hulabe.com`, so `getSiteOrigin()` returned the admin subdomain.
  Fix: added `getClientPortalOrigin()` and `getAdminOrigin()` helpers in
  `src/lib/auth/site-origin.ts` that read `NEXT_PUBLIC_CLIENT_URL` /
  `NEXT_PUBLIC_ADMIN_URL`. Client-targeted flows force the client subdomain
  regardless of where the admin is browsing.

- **Vercel apex → www redirect broke OG previews.** The metadata pointed at
  `https://hulabe.com` (apex), but Vercel 307'd to `https://www.hulabe.com`,
  and most OG scrapers refuse to follow image redirects. Fixed by changing
  `NEXT_PUBLIC_SITE_URL` and every code fallback to the canonical
  `https://www.hulabe.com`.

### 12. Marketing assets

- **OG image** (`/opengraph-image`): 1200×630 dark background with lime
  halo, `</>` mark, "Your idea, shipped." title, "DEV STUDIO · Quote in 24h
  · Fixed price · From €500" footer.
- **Twitter image** (`/twitter-image`): 1200×675 (16:9 ratio Twitter prefers
  over OG's 1.91:1). Same branding.
- **LinkedIn banner** (`/linkedin-banner`): 1584×396 (4:1, retina-sharp for
  LinkedIn's 1128×191 spec). Brand on the left, tagline + trust strip on the
  right.

All three are generated server-side via `next/og`, no static files to
maintain.

### 13. SEO overhaul

- **Sitemap** (`src/app/sitemap.ts`): per-route fixed `lastModified` dates
  (no more `new Date()` invalidating freshness signals), added `/llms.txt`
  and `/ai.txt`, hreflang alternates per URL (`fr-FR` / `en-US` / `es-ES` /
  `x-default`).
- **Robots** (`src/app/robots.ts`): dropped the deprecated `host:` directive.
  Kept the explicit AI-bot allowlist (ChatGPT, Claude, Perplexity,
  Google-Extended, etc.).
- **Manifest PWA** (`src/app/manifest.ts`): standalone display, lime theme
  color, app icons.
- **JSON-LD** (`src/components/json-ld.tsx`): added Paris `PostalAddress`,
  `areaServed` enumerating 5 countries, `sameAs` placeholder for LinkedIn.
- **Hreflang in metadata**: `alternates.languages` with all 4 entries.
- **Security headers** (`next.config.mjs`): X-Content-Type-Options,
  X-Frame-Options, HSTS (2 years + preload), Referrer-Policy,
  Permissions-Policy, plus `X-Robots-Tag: noindex, nofollow` on /admin,
  /client, /auth.
- **Image optimization**: `next.config.mjs` `images.formats` with AVIF +
  WebP, `remotePatterns` for `image.thum.io`. `<PreviewImage>` in
  case-studies upgraded to `next/image` with `fill` + responsive `sizes`.

### 14. Public AI/LLM files

- **`/llms.txt`**: dev-studio summary, services, pricing, process, FAQ,
  contact. Updated to reflect "fast kickoff" / no Slack-or-WhatsApp claims.
- **`/ai.txt`**: explicit AI crawler policy (allow `/`, disallow `/admin`,
  `/client`, `/auth`, `/api`).

---

## Database schema (Prisma)

Models:

- `Lead` — Inbound contact form / simulator submissions with AI score fields
- `Project` — Client work. Status enum (DRAFT → QUOTED → SIGNED → IN_PROGRESS
  → IN_REVIEW → SHIPPED → ARCHIVED). Pricing in cents.
- `Note` — Polymorphic notes on Lead or Project, optional `visibleToClient`
- `Deliverable` — Project deliverables, kind enum, file metadata for FILE
  kind, `visibleToClient`
- `SupportRequest` — Client-initiated support tickets per project
- `Activity` — Audit trail (lead status, project status, deliverable added,
  invoice created/changed, support request, etc.)
- `Invoice` + `InvoiceLine` + `InvoiceCounter` — Full invoicing system
- `User` — Unified user table (admins + clients), `UserRole` enum,
  `AdminScope` enum, invitation chain, password setup tracking
- `ProjectMember` — Project ↔ User join (replaces the prior 4-table mess)

Cascade deletes are configured everywhere so the OWNER-only delete flows on
leads / projects / invoices / clients cascade cleanly.

---

## Server actions

Split into focused files under `src/lib/admin/`:

- `auth.ts` — `requireAdmin` / `requireMutator` / `requireOwner` +
  `findActiveAdminByEmail`
- `actions.ts` — Lead actions, project actions, deliverable shortcuts,
  delete (OWNER), archive
- `team-actions.ts` — Admin team CRUD (invite, deactivate, role change)
- `client-actions.ts` — Client CRUD (invite, edit, deactivate, resend invite,
  delete)
- `assignment-actions.ts` — Project ↔ User assignment + access scope toggle
- `deliverable-actions.ts` — Deliverable create (with file upload), delete,
  toggle visibility
- `invoice-actions.ts` — Invoice create, update, status, delete (OWNER)
- `email-actions.ts` — `sendTemplateEmail` for admin-initiated templates
- `kpi.ts` — Dashboard KPI aggregation

Public auth actions in `src/lib/auth/password-actions.ts` (forgot-password
flows for both admin and client login pages).

---

## i18n state

- All UI strings live in `src/i18n/messages/{fr,en,es}.json`
- Default locale is `en` (changed from `fr` after positioning the studio for
  international clients)
- Fallback chain: cookie → `Accept-Language` → `en`
- Validated parity across all three locales

---

## How to operate

### Local dev

```bash
pnpm install
pnpm prisma generate
pnpm dev   # http://localhost:3000
```

`.env.local` requires:
- `DATABASE_URL` + `DIRECT_URL` (Supabase Postgres)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` +
  `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SITE_URL` = `https://www.hulabe.com`
- `NEXT_PUBLIC_ADMIN_URL` = `https://admin.hulabe.com`
- `NEXT_PUBLIC_CLIENT_URL` = `https://client.hulabe.com`
- `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`

### Production setup (one-time)

1. **Vercel env vars**: set all of the above. Critically:
   `NEXT_PUBLIC_SITE_URL` must be `https://www.hulabe.com` (not apex) —
   otherwise OG previews break on www.
2. **Supabase Auth → URL Configuration**:
   - Site URL: `https://www.hulabe.com`
   - Redirect URLs: all of
     - `https://www.hulabe.com/auth/callback`
     - `https://www.hulabe.com/auth/callback?**`
     - `https://admin.hulabe.com/auth/callback`
     - `https://admin.hulabe.com/auth/callback?**`
     - `https://client.hulabe.com/auth/callback`
     - `https://client.hulabe.com/auth/callback?**`
     - plus localhost variants for dev
3. **Supabase Storage**: create a private bucket named `deliverables` (50MB
   file size limit). See `SUPABASE_STORAGE.md` for details.
4. **Seed the first OWNER** via SQL in Supabase (instructions in
   `SETUP.md`).
5. **Submit sitemap** to Google Search Console after the first deploy.

### Migration scripts (one-shot, already applied to prod)

- `scripts/migrate-unify-users.ts` — Unified Admin + Client tables into `User`
- `scripts/fix-user-constraints.ts` — Renamed Postgres constraints after the
  table rename so Prisma sees a clean diff

Both are idempotent (use `IF EXISTS` / `IF NOT EXISTS`) and safe to re-run if
needed.

---

## What's NOT done (intentional or deferred)

- **No `/blog`** yet. Adding one is the highest-leverage SEO move when there
  is content to write.
- **No `aggregateRating` JSON-LD**. Will be useful once there are 5+ public
  testimonials.
- **No URL-prefixed locales (`/fr/`, `/en/`, `/es/`)**. The cookie-based
  approach is good enough for now, but a future migration would unlock
  proper hreflang and per-locale OG images.
- **No Stripe integration on invoices**. Current invoicing is manual + PDF.
  Stripe payment links are a logical next step.
- **No automated tests**. The codebase is small and changing fast; manual QA
  via the live dev server has been the loop. A test suite is a future task.

---

## Build status

As of the last build:

- 38 routes (29 dynamic, 9 static)
- 0 TypeScript errors
- ~87 KB shared First Load JS
- Middleware ~80 KB
- All marketing routes prerender; admin/client are SSR

---

## Quick reference: where things live

| Concern | File / Folder |
|---|---|
| Subdomain routing | `src/middleware.ts` |
| Theme tokens | `src/app/globals.css` |
| Theme provider + toggle | `src/components/theme-provider.tsx` + `src/components/theme-toggle.tsx` |
| Logo (auto-themed) | `src/components/logo.tsx` |
| Hero + landing sections | `src/components/sections/*.tsx` |
| Marketing layout + metadata | `src/app/(marketing)/layout.tsx` |
| OG / Twitter / LinkedIn images | `src/app/opengraph-image.tsx`, `twitter-image.tsx`, `linkedin-banner/route.tsx` |
| Sitemap | `src/app/sitemap.ts` |
| Robots | `src/app/robots.ts` |
| PWA manifest | `src/app/manifest.ts` |
| JSON-LD | `src/components/json-ld.tsx` |
| Admin shell | `src/components/admin/admin-shell.tsx` |
| Client shell | `src/components/client/client-shell.tsx` |
| Auth helpers | `src/lib/admin/auth.ts`, `src/lib/client/auth.ts` |
| Subdomain helpers | `src/lib/auth/site-origin.ts` |
| Storage helpers | `src/lib/supabase/storage.ts` |
| PDF template | `src/lib/invoice/pdf.tsx` |
| Invoice numbering | `src/lib/invoice/numbering.ts` |
| KPI queries | `src/lib/admin/kpi.ts` |
| Email senders | `src/lib/resend.ts` |
| Prisma schema | `prisma/schema.prisma` |
| i18n messages | `src/i18n/messages/{fr,en,es}.json` |
| Setup guides | `SETUP.md`, `SUPABASE_STORAGE.md` |

---

That's the build, top to bottom. Ship it.
