# Hulabe — Setup manuel

Ce que **toi** tu dois faire avant que le projet tourne en prod. Tout ce qui peut être codé est codé — il te reste les comptes externes à créer et les clés à coller.

Toutes les étapes sont indépendantes (sauf §2 qui est requis pour §4 et §7). Tu peux tout faire dans cet ordre, ou prioriser.

---

## 1. Pré-requis local

- **Node.js 18+** (idéalement 20+) — vérifie avec `node --version`
- **pnpm 9+** — install : `npm install -g pnpm`
- **git** — pour clone le repo

Puis à la racine du projet :

```bash
pnpm install
cp .env.example .env.local
```

Tu vas remplir `.env.local` au fur et à mesure des sections ci-dessous.

---

## 2. Supabase (database + auth)

Hulabe utilise **un seul projet Supabase** pour la DB Postgres ET l'auth (admin + client portal).

1. Crée un compte sur [supabase.com](https://supabase.com)
2. **New project** → région **EU West (Paris)** ou **EU Central (Frankfurt)** pour le RGPD
3. Choisis un mot de passe DB fort, garde-le en sécurité
4. Une fois créé, va dans **Project Settings → Database → Connection string**
5. Récupère deux URLs :
   - **`DATABASE_URL`** : Mode **Transaction**, port `6543`, ajoute `?pgbouncer=true` à la fin
   - **`DIRECT_URL`** : Mode **Session**, port `5432`
6. **Project Settings → API**, récupère :
   - **Project URL** (commence par `https://xxxx.supabase.co`)
   - **anon (public) API key** (commence par `eyJ...`)
   - **service_role key** (commence par `eyJ...`) — **secrète**, à protéger
7. Mets dans `.env.local` :
   ```
   DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.xxx:password@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."
   ```

> **Plus de `ADMIN_EMAILS` env var.** L'accès admin est géré dynamiquement par la table `AdminUser` côté DB (voir §4 ci-dessous pour seed le premier OWNER).

8. **Crée toutes les tables** Prisma (Lead, Project, Note, Activity, Invoice, Deliverable, SupportRequest, AdminUser) :
   ```bash
   pnpm db:push
   ```
   Ou si tu préfères versionner les migrations dans le repo :
   ```bash
   pnpm db:migrate --name init
   git add prisma/migrations
   ```
9. **Auth → URL Configuration** :
   - **Site URL** : `https://hulabe.com` (en prod) ou `http://localhost:3000` (en dev local)
   - **Redirect URLs** : ajoute les 3 valeurs suivantes
     ```
     https://hulabe.com/auth/callback
     https://client.hulabe.com/auth/callback
     http://localhost:3000/auth/callback
     ```
10. **Auth → Email Templates → Magic Link** : le défaut Supabase fonctionne. Tu peux personnaliser le HTML si tu veux brander.

---

## 3. Resend (emails transactionnels)

Resend envoie 6 types d'emails :
- Confirmation au lead qui remplit un form
- Notification à toi sur chaque nouveau lead
- Invitation au portail client (depuis l'admin)
- Update de status projet (auto sur changement)
- Nouveau livrable / note visible (auto sur ajout)
- Réponse de support (admin → client)

1. Crée un compte sur [resend.com](https://resend.com)
2. **Add domain** → entre `hulabe.com`
3. Resend te donne 3 records DNS à ajouter chez ton registrar (OVH, Gandi, Cloudflare…) :
   - SPF (TXT)
   - DKIM (TXT × 1 ou 2)
   - DMARC (TXT) — souvent `v=DMARC1; p=none;`
4. Ajoute-les côté DNS, attends 5-30 min, clique **Verify** sur Resend
5. Une fois le domaine **Verified**, **API Keys → Create API Key** (full access)
6. Mets dans `.env.local` :
   ```
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   RESEND_FROM_EMAIL="Hulabe <hello@hulabe.com>"
   NOTIFICATION_EMAIL="hugo@hulabe.com"
   ```
7. Crée l'alias public **`support@hulabe.com`** côté Resend (Inbound) ou ton hébergeur mail — c'est l'email affiché publiquement (footer, legal, error toasts)

**Variables clés :**
- `RESEND_FROM_EMAIL` — le `From:` de tous les emails sortants (doit être sur le domaine vérifié)
- `NOTIFICATION_EMAIL` — où **toi** tu reçois les notifications de leads + tickets support (= ton inbox perso)

> Sans `RESEND_API_KEY` valide, les API routes fonctionnent toujours (les leads sont enregistrés en DB), mais aucun email n'est envoyé. Tu peux tester en dev avec `RESEND_FROM_EMAIL="onboarding@resend.dev"` mais tu ne peux envoyer qu'à toi-même tant que le domaine n'est pas vérifié.

---

## 4. PostHog (analytics + session replay)

1. Crée un compte sur [eu.posthog.com](https://eu.posthog.com) (instance EU pour RGPD)
2. **Create new project** → nom `Hulabe`, type **Web**
3. Récupère ta **Project API Key** (commence par `phc_…`)
4. Mets dans `.env.local` :
   ```
   NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxxxxxxxx"
   NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"
   ```
5. Côté PostHog dashboard, vérifie :
   - **Settings → Project → Autocapture** : ON (par défaut)
   - **Settings → Project → Session Replay** : ON (active-le manuellement, c'est OFF par défaut)
   - **Settings → Project → Recording → Mask all inputs** : déjà géré côté code, coche aussi côté serveur pour double-sécurité

**Custom events** trackés automatiquement par le code :
- `simulator_started`, `simulator_step_advanced`, `simulator_submitted` / `simulator_failed`
- `contact_submitted` / `contact_failed`
- `language_changed`

**Idées de dashboards à créer dans PostHog une fois en prod :**
- **Funnel** : pageview → simulator_started → simulator_submitted (taux de conversion)
- **Dashboard "Hulabe / Acquisition"** : sessions, top pages, conversion simulator, conversion contact, langues

---

## 5. Premier admin OWNER (SQL direct dans Supabase)

L'accès à `/admin` est contrôlé par la table `AdminUser`. La connexion se fait **par email + mot de passe** classique. Tant que cette table est vide, **personne ne peut accéder à l'admin** — il faut donc créer le premier OWNER manuellement, puis utiliser le flow « mot de passe oublié » pour définir son mot de passe.

### 5.1 Exécuter la query SQL

1. Va sur Supabase → ton projet → **SQL Editor**
2. **New query**
3. Colle cette query (remplace l'email + le nom) :

```sql
INSERT INTO "AdminUser" (
  "id",
  "email",
  "name",
  "role",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  -- cuid-style id (manuel, ou utilise gen_random_uuid()::text)
  'cm_' || replace(gen_random_uuid()::text, '-', ''),
  -- ton email (sera matché case-insensitive au login)
  'admin@hulabe.com',
  'Admin',
  'OWNER',
  true,
  NOW(),
  NOW()
);
```

4. Clique **Run**. Tu dois voir `Success. No rows returned`.
5. Vérifie : **Table editor → AdminUser** → ta ligne doit être là, `role: OWNER`, `isActive: true`.

> Tu n'as **pas besoin** de créer un compte Supabase Auth à la main : il sera créé automatiquement à l'étape 5.2.

### 5.2 Définir ton premier mot de passe

1. Lance `pnpm dev`
2. Va sur `http://localhost:3000/admin/login`
3. Clique sur **« Première connexion ou mot de passe oublié ? »**
4. Entre l'email exact que tu viens d'insérer en SQL → submit
5. Tu reçois un email contenant un lien **« Définir mon mot de passe »**
6. Clique → tu arrives sur `/admin/setup-password`
7. Choisis ton mot de passe (min 8 caractères) → submit
8. Tu arrives sur `/admin` avec ton badge **OWNER**
9. Pour tes prochaines connexions, va sur `/admin/login` et utilise email + mot de passe

### 5.3 Inviter / gérer les autres admins

À partir de là, tu peux **gérer toute l'équipe via l'UI** (plus jamais besoin de SQL) :

- `/admin/team` (visible uniquement par les OWNER)
- **Inviter** un nouvel admin par email + nom + rôle (OWNER / ADMIN / VIEWER) → email avec lien « Définir mon mot de passe »
- **Désactiver / réactiver** un admin (compte gardé en DB, accès retiré)
- **Supprimer** définitivement un admin
- **Promouvoir / rétrograder** un admin
- **Renvoyer le lien de mot de passe** pour un admin qui n'a jamais défini son mot de passe (ou qui l'a oublié)
- **Renommer** un admin

### 5.4 Rôles

- **OWNER** : tous les droits, y compris gérer les autres admins (seul à voir `/admin/team`)
- **ADMIN** : tout sauf gérer les admins (peut traiter les leads, projets, support, etc.)
- **VIEWER** : lecture seule (peut consulter mais pas modifier — les server actions bloquent côté serveur)

### 5.5 Edge cases

- **Last OWNER protection** : impossible de désactiver / supprimer / rétrograder le dernier OWNER actif. L'UI affichera une erreur.
- **Self-protection** : tu ne peux pas te désactiver / supprimer toi-même (même si OWNER).
- **Email collision** : si tu essaies d'inviter un email qui existe déjà (actif ou désactivé), l'UI t'oriente vers la réactivation plutôt que la création.
- **Pas encore log in** : un admin invité existe en DB tant qu'il n'a pas défini son mot de passe. `passwordSetAt` reste null. Tu peux renvoyer le lien à tout moment depuis `/admin/team`.

### 5.6 Côté client portal

Le **client portal** utilise exactement la même mécanique :
- Login par email + mot de passe sur `client.hulabe.com/login`
- « Première connexion ou mot de passe oublié ? » envoie un lien pour définir/réinitialiser le mot de passe
- Quand un OWNER clique **« Inviter au portail »** sur un projet admin → l'invitation contient un lien « Définir mon mot de passe » qui arrive sur `/client/setup-password`

Seuls les emails associés à un `Lead` ayant au moins un `Project` peuvent recevoir un lien de connexion client.

---

## 6. Anthropic API — AI lead scoring

Chaque nouveau lead (form contact ou simulator) est scoré automatiquement par Claude : score 1-10 + raisonnement + suggestion de réponse personnalisée + flags + recommended action. Affiché en haut de `/admin/leads/[id]` avec boutons "Copier" et "Envoyer" (mailto:).

1. Crée un compte sur [console.anthropic.com](https://console.anthropic.com)
2. **Settings → API Keys → Create Key** (nomme-la "Hulabe prod")
3. Mets dans `.env.local` :
   ```
   ANTHROPIC_API_KEY="sk-ant-xxx..."
   ANTHROPIC_MODEL="claude-haiku-4-5-20251001"
   ```
4. **Modèles disponibles** :
   - `claude-haiku-4-5-20251001` (par défaut, ~$1/$5 par M tokens, ~500ms) — **Recommended**
   - `claude-sonnet-4-6` si tu veux des réponses plus nuancées (~3x plus cher)
5. **Coût estimé** : ~0,001€ par lead avec Haiku. Pour 1000 leads/mois = ~1€.

Sans clé API, le scoring est skip silencieusement et l'UI affiche "pas encore évalué" avec un bouton `SCORE` manuel. Tu peux re-scorer un lead à tout moment depuis `/admin/leads/[id]` (bouton `RE-SCORE` dans le panel AI).

---

## 7. Client portal — sous-domaine `client.hulabe.com`

Le portail client est servi sur `client.hulabe.com` via un rewrite Next.js. Tout le code vit dans `src/app/client/*`, et Vercel route automatiquement le sous-domaine. Détails de l'architecture dans [`CLIENT_PORTAL.md`](./CLIENT_PORTAL.md).

### 7.1 DNS

Chez ton registrar, ajoute un record CNAME :

```
CNAME   client   cname.vercel-dns.com
```

(propagation : 5-30 min)

### 7.2 Vercel — Domains

Sur ton projet Vercel → **Domains** → add `client.hulabe.com`. Vercel détecte le CNAME et provisionne SSL automatiquement.

> Important : **n'attache PAS** un domaine dédié à `/client`, et ne configure pas de redirect Vercel. Le rewrite dans `next.config.mjs` (déjà en place) fait tout le travail.

### 7.3 Variables d'environnement

Dans `.env.local` (dev) et Vercel (prod) :

```
NEXT_PUBLIC_CLIENT_HOST="client.hulabe.com"
NEXT_PUBLIC_CLIENT_URL="https://client.hulabe.com"
```

`SUPABASE_SERVICE_ROLE_KEY` (déjà configuré en §1) sert ici à générer les magic-links d'invitation.

> En dev local, tu n'as pas besoin du sous-domaine — `http://localhost:3000/client/login` fonctionne pareil.

### 7.4 Site URL principale Supabase

Sur **Supabase → Authentication → URL Configuration**, vérifie que **Site URL** = `https://hulabe.com`. Les cookies Supabase sont attachés au domaine parent `.hulabe.com` pour fonctionner cross-subdomain (admin sur `hulabe.com/admin` ET portail sur `client.hulabe.com` partagent la session).

### 7.5 Comment fonctionne le flow

1. Sur `/admin/projects/[id]`, tu cliques **"Inviter au portail"**
2. Server action génère un magic-link Supabase via le service role key
3. Email envoyé via Resend au `lead.email` avec un template branded Hulabe
4. Le client clique le lien → `/auth/callback` → cookie session set → redirect vers `/client/projects/[id]`
5. Plus tard, le client peut aussi venir directement sur `client.hulabe.com` et entrer son email pour re-login (self-service)

---

## 8. Vercel (hosting)

1. Crée un compte sur [vercel.com](https://vercel.com), connecte-le à GitHub
2. Push ton repo sur GitHub (privé recommandé)
3. **Import Project** → sélectionne le repo Hulabe
4. Framework : Next.js (auto-détecté). Install command : `pnpm install`. Build command : `pnpm build`
5. **Environment Variables** — ajoute **toutes** les vars suivantes :
   ```
   # Database (Supabase)
   DATABASE_URL
   DIRECT_URL

   # Supabase Auth (admin + client portal)
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY           # cocher "Sensitive"
   # (Pas de ADMIN_EMAILS — l'accès admin est géré via la table AdminUser, voir §5)

   # Resend
   RESEND_API_KEY                       # cocher "Sensitive"
   RESEND_FROM_EMAIL
   NOTIFICATION_EMAIL

   # PostHog
   NEXT_PUBLIC_POSTHOG_KEY
   NEXT_PUBLIC_POSTHOG_HOST

   # Anthropic (AI lead scoring)
   ANTHROPIC_API_KEY                    # cocher "Sensitive"
   ANTHROPIC_MODEL

   # Client portal subdomain
   NEXT_PUBLIC_CLIENT_HOST
   NEXT_PUBLIC_CLIENT_URL

   # Public
   NEXT_PUBLIC_SITE_URL
   ```
6. **Deploy**

---

## 9. Domaine `hulabe.com`

1. Si tu n'as pas encore le domaine : achète sur **OVH**, **Gandi**, ou **Porkbun** (~12€/an)
2. Côté Vercel → **Project → Domains** → `hulabe.com` + `www.hulabe.com`
3. Vercel te donne les DNS à pointer :
   - **Apex (`hulabe.com`)** : `A 76.76.21.21`
   - **www** : `CNAME cname.vercel-dns.com`
   - **client** : `CNAME cname.vercel-dns.com` (voir §5.1)
4. Mets `NEXT_PUBLIC_SITE_URL=https://hulabe.com` dans Vercel env vars (sans `/` final)
5. SSL est automatique (Let's Encrypt) sous 24h

---

## 10. SEO post-déploiement

1. **Google Search Console** : [search.google.com/search-console](https://search.google.com/search-console) → ajoute `hulabe.com` → vérification via DNS TXT record
2. Soumets le sitemap : `https://hulabe.com/sitemap.xml` (généré automatiquement par le code)
3. Soumets le robots : `https://hulabe.com/robots.txt` (généré automatiquement)
4. **Bing Webmaster** : pareil sur [bing.com/webmasters](https://www.bing.com/webmasters)
5. Vérifie les **rich results** sur [search.google.com/test/rich-results](https://search.google.com/test/rich-results) — le code injecte JSON-LD pour `Organization`, `WebSite`, `Service`, `BreadcrumbList`
6. Vérifie l'**OG image** sur [opengraph.xyz](https://www.opengraph.xyz) — image dynamique générée par `src/app/opengraph-image.tsx`

---

## 11. Checklist post-déploiement

### Site marketing
- [ ] La page d'accueil charge en FR (`/`)
- [ ] `/en` et `/es` chargent et `<html lang>` est correct
- [ ] LanguageSwitch fonctionne (URL change, contenu change)
- [ ] Le simulateur passe les étapes sans erreur (questions changent selon le service choisi)
- [ ] Soumission simulator → lead créé en DB (vérifie via Supabase Studio)
- [ ] Soumission `#contact` → même chose, source = `CONTACT_FORM`
- [ ] Email de confirmation reçu sur l'email saisi
- [ ] Email de notification reçu sur `NOTIFICATION_EMAIL`
- [ ] `https://hulabe.com/sitemap.xml` accessible
- [ ] `https://hulabe.com/robots.txt` accessible
- [ ] Lighthouse mobile > 90 sur Performance, Accessibility, SEO

### Admin platform
- [ ] `/admin/login` charge sans erreur
- [ ] Magic-link arrive sur ton email après submit
- [ ] Click sur le lien → redirect sur `/admin` (dashboard)
- [ ] Login avec un email **non listé** dans `ADMIN_EMAILS` → rejeté avec `error=not_authorized`
- [ ] Dashboard affiche les stats (leads total, 7j, projets actifs, won ce mois)
- [ ] `/admin/leads` montre la liste des leads avec le score AI (colonne `AI`)
- [ ] Click sur un lead → détail avec panel **AI scoring** en haut (si `ANTHROPIC_API_KEY` configurée)
- [ ] Le bouton "RE-SCORE" déclenche un appel Claude et met à jour
- [ ] Le bouton "COPIER" copie la suggestion de réponse
- [ ] Le bouton "ENVOYER" ouvre mailto: avec la réponse pré-remplie
- [ ] `/admin/projects` montre le kanban
- [ ] Création d'un projet depuis un lead détail → projet créé + lead passé en WON
- [ ] Status change projet → email envoyé au client (si dans QUOTED/SIGNED/IN_PROGRESS/IN_REVIEW/SHIPPED)
- [ ] Ajout d'un livrable → email envoyé au client
- [ ] Note avec "Visible côté client" coché → email envoyé au client + Markdown rendu correctement
- [ ] Bouton "Inviter au portail" sur projet detail → email magic-link reçu

### Client portal
- [ ] `https://client.hulabe.com/login` charge sans erreur
- [ ] Magic-link arrive
- [ ] Click sur le lien → redirect sur `/client` avec les projets du user
- [ ] Login avec un email qui n'a aucun projet → rejeté avec `error=not_authorized`
- [ ] `/client/projects/[id]` affiche la timeline 6 étapes
- [ ] Les livrables s'affichent
- [ ] Les notes visibles s'affichent (les notes internes admin restent invisibles)
- [ ] Markdown rendu correctement
- [ ] Form support → ticket créé + email à `NOTIFICATION_EMAIL` (admin)
- [ ] L'admin répond au ticket → email reçu côté client + réponse visible dans Updates

### PostHog & analytics
- [ ] PostHog reçoit des events (vérifie dans **Activity**)
- [ ] Session replay visible dans PostHog (clique sur une session)
- [ ] Les inputs des forms NE SONT PAS capturés dans le replay (RGPD)

---

## 12. Ce qui reste à faire dans le code (côté toi)

- **Vrai contenu juridique** dans `/legal/privacy` et `/legal/terms` — actuellement un draft minimal. Si t'as un avocat en relation pro, fais-le relire
- **Vrai mail `support@hulabe.com`** : crée l'alias chez Resend (Inbound) ou côté ton hébergeur mail pour qu'il route vers ta boîte perso
- **Pitch + stack des case studies** : les 3 cas (RektAds, BCN Immobilier, Maison Pilates) ont des pitches placeholders dans `src/components/sections/case-studies.tsx`. À enrichir avec les vraies infos (stack utilisée, ce qu'on a fait, résultats)
- **Screenshots case studies** : actuellement servis depuis `/public/cases/*.png`. Re-capture si les sites changent : `curl "https://image.thum.io/get/width/1280/crop/800/noanimate/png/https://rektads.com" -o public/cases/rektads.png`
- **Maintenance contracts** + abonnement Stripe : pas encore implémenté, voir `CLIENT_PORTAL.md` pour le plan

---

## Variables d'environnement (rappel)

Toutes les variables vivent dans `.env.local` (dev) et Vercel env (prod).

```bash
# ─── Database (Supabase Postgres) ────────────────────────────────
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"

# ─── Supabase Auth (admin + client portal) ───────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."           # 🔒 sensitive
# Pas de ADMIN_EMAILS — l'accès admin est géré via la table AdminUser (voir §5).

# ─── Resend (emails) ─────────────────────────────────────────────
RESEND_API_KEY="re_xxxxxxxxxxxx"                              # 🔒 sensitive
RESEND_FROM_EMAIL="Hulabe <hello@hulabe.com>"
NOTIFICATION_EMAIL="hugo@hulabe.com"

# ─── PostHog (analytics + session replay) ────────────────────────
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_POSTHOG_HOST="https://eu.i.posthog.com"

# ─── Anthropic (AI lead scoring) ─────────────────────────────────
ANTHROPIC_API_KEY="sk-ant-..."                                # 🔒 sensitive
ANTHROPIC_MODEL="claude-haiku-4-5-20251001"

# ─── Client portal subdomain ─────────────────────────────────────
NEXT_PUBLIC_CLIENT_HOST="client.hulabe.com"
NEXT_PUBLIC_CLIENT_URL="https://client.hulabe.com"

# ─── Public ──────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL="https://hulabe.com"
```

**Notes critiques :**
- Les vars `NEXT_PUBLIC_*` sont exposées au navigateur — n'y mets jamais de secret
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY` sont **strictement server-side** (pas de préfixe `NEXT_PUBLIC_`)
- `RESEND_FROM_EMAIL` doit utiliser un domaine **vérifié** dans Resend
- Le premier admin OWNER se crée en **SQL direct sur Supabase** (voir §5)
- Sans certaines vars, les features dégradent gracieusement :
  - Pas de `RESEND_API_KEY` → leads enregistrés en DB mais aucun email envoyé
  - Pas de `ANTHROPIC_API_KEY` → pas de scoring auto, bouton manuel disponible
  - Pas de `SUPABASE_SERVICE_ROLE_KEY` → impossible d'inviter au portail (erreur affichée dans l'UI admin)
