# Hulabe — Setup manuel

Ce que **toi** tu dois faire avant que le projet tourne en prod. Tu n'as rien fait pour l'instant — c'est ta checklist complète.

---

## 1. Installer pnpm (si pas déjà fait)

```bash
npm install -g pnpm
```

Ensuite à la racine du projet :

```bash
pnpm install
```

---

## 2. Supabase (database)

1. Créer un compte sur [supabase.com](https://supabase.com).
2. **New project** → région **EU West (Paris)** ou **EU Central (Frankfurt)** pour le RGPD.
3. Choisis un mot de passe DB fort, garde-le en sécurité.
4. Une fois le projet créé, va dans **Project Settings → Database → Connection string**.
5. Récupère deux URLs :
   - **`DATABASE_URL`** : Mode **Transaction**, port `6543`, ajoute `?pgbouncer=true` à la fin
   - **`DIRECT_URL`** : Mode **Session**, port `5432`
6. Mets-les dans `.env.local` (créé en copiant `.env.example`).
7. Crée la table `Lead` :
   ```bash
   pnpm db:push
   ```
   Ou si tu veux versionner les migrations :
   ```bash
   pnpm db:migrate --name init
   git add prisma/migrations
   ```

---

## 3. Resend (emails transactionnels)

1. Créer un compte sur [resend.com](https://resend.com).
2. **Add domain** → entre `hulabe.com`.
3. Resend te donne 3 records DNS à ajouter chez ton registrar (OVH, Gandi, Cloudflare…) :
   - SPF (TXT)
   - DKIM (TXT × 1 ou 2)
   - DMARC (TXT) — souvent `v=DMARC1; p=none;`
4. Ajoute-les côté DNS, attends 5-30 min, clique **Verify** sur Resend.
5. Une fois le domaine **Verified**, va dans **API Keys** → **Create API Key** (full access).
6. Mets dans `.env.local` :
   ```
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   RESEND_FROM_EMAIL="Hulabe <hello@hulabe.com>"
   NOTIFICATION_EMAIL="hugo@hulabe.com"
   ```
7. **Avant** que le domaine soit vérifié, tu peux tester en local avec `RESEND_FROM_EMAIL="onboarding@resend.dev"` (mais l'email ne pourra qu'être envoyé à toi-même).
8. Crée un alias `support@hulabe.com` côté Resend ou ton hébergeur mail — c'est l'email affiché publiquement (footer, legal, error toasts).

> Sans clé Resend valide, les API routes continuent de fonctionner (le lead est enregistré en DB) mais aucun email n'est envoyé.

---

## 4. PostHog (analytics + session replay) — **NOUVEAU**

1. Créer un compte sur [eu.posthog.com](https://eu.posthog.com) (instance EU pour RGPD).
2. **Create new project** → nom `Hulabe`, type **Web**.
3. Récupère ta **Project API Key** (commence par `phc_…`).
4. Mets dans `.env.local` :
   ```
   NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxxxxxxxx"
   NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"
   ```
5. Côté PostHog dashboard, vérifie :
   - **Settings → Project → Autocapture** : ON (par défaut)
   - **Settings → Project → Session Replay** : ON (active-le manuellement, c'est OFF par défaut)
   - **Settings → Project → Recording → Mask all inputs** : déjà géré côté code, mais coche-le aussi côté serveur pour double-sécurité
6. Custom events trackés automatiquement par le code :
   - `simulator_started`
   - `simulator_step_advanced`
   - `simulator_submitted` / `simulator_failed`
   - `contact_submitted` / `contact_failed`
   - `language_changed`
7. Bonnes choses à faire dans PostHog une fois en prod :
   - Crée un **Funnel** : pageview → simulator_started → simulator_submitted (taux de conversion du simulateur)
   - Crée un **Dashboard** "Hulabe / Acquisition" avec : sessions, top pages, conversion simulator, conversion contact, langues utilisées.

---

## 5. Cal.com (booking)

1. Crée un compte sur [cal.com](https://cal.com) (handle `hulabe` si possible).
2. Crée un type d'événement : nom `Brief Hulabe`, durée 30 min, slot type "Round-Robin" si plusieurs personnes plus tard.
3. Récupère l'URL publique (ex: `https://cal.com/hulabe/intro`).
4. Mets dans `.env.local` :
   ```
   NEXT_PUBLIC_CAL_URL="https://cal.com/hulabe/intro"
   ```

---

## 6. Vercel (hosting)

1. Crée un compte sur [vercel.com](https://vercel.com), connecte-le à Github.
2. Push ton repo sur Github (privé recommandé).
3. **Import Project** → sélectionne le repo Hulabe.
4. Framework : Next.js (auto-détecté). Install command : `pnpm install`. Build command : `pnpm build`.
5. **Environment Variables** : ajoute toutes les vars de `.env.example` (DATABASE_URL, DIRECT_URL, RESEND_API_KEY, RESEND_FROM_EMAIL, NOTIFICATION_EMAIL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CAL_URL, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST).
6. **Deploy**.

---

## 7. Domaine `hulabe.com`

1. Si tu n'as pas encore le domaine : achète sur **OVH**, **Gandi**, ou **Porkbun** (~12€/an).
2. Côté Vercel : **Project → Domains** → `hulabe.com` + `www.hulabe.com`.
3. Vercel te donne les DNS à pointer :
   - **Apex (`hulabe.com`)** : `A 76.76.21.21`
   - **www (`www.hulabe.com`)** : `CNAME cname.vercel-dns.com`
4. Mets `NEXT_PUBLIC_SITE_URL=https://hulabe.com` dans Vercel env vars (sans `/` final).
5. SSL est automatique (Let's Encrypt) sous 24h.

---

## 8. SEO post-déploiement

1. **Google Search Console** : [search.google.com/search-console](https://search.google.com/search-console) → ajoute `hulabe.com` → vérification via DNS TXT record.
2. Soumets le sitemap : `https://hulabe.com/sitemap.xml` (déjà généré automatiquement par le code).
3. Soumets le robots : `https://hulabe.com/robots.txt` (déjà généré automatiquement).
4. **Bing Webmaster** : pareil sur [bing.com/webmasters](https://www.bing.com/webmasters).
5. Vérifie les **rich results** : passe l'URL dans [search.google.com/test/rich-results](https://search.google.com/test/rich-results) — le code injecte déjà JSON-LD `Organization`, `WebSite`, `Service`, `BreadcrumbList`.
6. Vérifie l'OG image : passe l'URL dans [opengraph.xyz](https://www.opengraph.xyz) — l'image OG dynamique est générée par `src/app/opengraph-image.tsx`.

---

## 9. Checklist post-déploiement

- [ ] La page d'accueil charge en FR (`/`)
- [ ] `/en` et `/es` chargent et `<html lang>` est correct
- [ ] LanguageSwitch fonctionne (URL change, contenu change)
- [ ] Le simulateur passe les 5+ étapes sans erreur (les questions changent selon le service choisi)
- [ ] Soumission du simulateur → lead créé en DB (vérifie via Supabase Studio)
- [ ] Email de confirmation reçu sur l'email saisi
- [ ] Email de notification reçu sur `NOTIFICATION_EMAIL`
- [ ] Formulaire `#contact` → même chose, source = `CONTACT_FORM`
- [ ] PostHog reçoit des events (vérifie dans **Activity** sur PostHog)
- [ ] Session replay visible dans PostHog (clique sur une session)
- [ ] `https://hulabe.com/sitemap.xml` accessible
- [ ] `https://hulabe.com/robots.txt` accessible
- [ ] Lighthouse mobile > 90 sur Performance, Accessibility, SEO

---

## 10. Ce qui reste à faire dans le code (côté toi)

- **Case studies réels** : pour l'instant la section est désactivée. Quand tu auras des cas, on la ré-active avec les vrais projets (RektAds, CRM Notion, etc.).
- **Vrai contenu juridique** dans `/legal/privacy` et `/legal/terms` — actuellement c'est un draft minimal RGPD-compliant. Si t'as un avocat en relation pro, fais-le relire.
- **Vrai mail support@hulabe.com** : crée l'alias chez Resend (Inbound) ou côté ton hébergeur mail pour qu'il route vers ta boîte perso.
- **Logo PNG en haute résolution** pour OG image alternative — le code génère déjà une OG dynamique mais tu peux préférer une statique.

---

## Variables d'environnement (rappel)

```
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"

# Resend
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="Hulabe <hello@hulabe.com>"
NOTIFICATION_EMAIL="hugo@hulabe.com"

# Public
NEXT_PUBLIC_SITE_URL="https://hulabe.com"
NEXT_PUBLIC_CAL_URL="https://cal.com/hulabe/intro"

# PostHog (analytics + session replay)
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"
```
