# Client portal — design doc

> Statut : **PLAN**, pas encore implémenté. Les fondations DB sont déjà posées.

L'objectif : un portail client à `client.hulabe.com` (ou `hulabe.com/client` selon ton choix au moment du build) où chaque client peut voir l'avancement de son projet, accéder aux livrables, et ouvrir un ticket pendant la fenêtre support 14j ou via maintenance.

---

## 1. Architecture cible

### Option recommandée — sous-domaine via rewrite Vercel

- Code dans **la même app Next.js** (sous `src/app/client/...`)
- Vercel rewrite : `client.hulabe.com/*` → `hulabe.com/client/*`
- Avantages :
  - Prisma client, types, validations partagés avec l'admin
  - 1 seul deploy
  - Cookies d'auth (Supabase) restent sur `.hulabe.com` → cross-subdomain natif

### Layout du repo

```
src/app/
├── (marketing)/[locale]/...       ← landing publique (existe)
├── admin/...                       ← admin (existe)
└── client/                         ← À VENIR
    ├── layout.tsx                  ← header client minimaliste
    ├── login/page.tsx              ← magic link via lead.email
    ├── page.tsx                    ← dashboard client (1 ou plusieurs projets)
    ├── projects/[id]/
    │   ├── page.tsx                ← détail projet
    │   ├── deliverables/page.tsx
    │   └── support/page.tsx        ← ouvrir un ticket
    └── settings/page.tsx           ← changer email, déconnexion
```

### Auth client

- Supabase Auth, magic link (réutilise l'infra admin)
- **Différenciation** : un user authentifié est admin si son email ∈ `ADMIN_EMAILS`, sinon il est traité comme client
- Au login, on cherche les `Project` où `lead.email = user.email` → liste des projets accessibles
- Pas besoin de table users séparée pour la v1

### RLS / contrôles d'accès

- Pas de Supabase RLS direct sur la table `Lead` (Prisma bypass) — on fait le check applicatif :
  - `requireClient()` retourne le user authentifié, redirect sinon
  - Pour chaque projet : `assertProjectBelongsToClient(projectId, user.email)` qui vérifie `project.lead.email === user.email`
- Tout flow lecture client passe par un helper centralisé `getClientProject(id, email)` qui filtre déjà

---

## 2. Schéma DB — déjà prêt ✅

Champs / modèles ajoutés au schema actuel pour préparer le portail :

- `Note.visibleToClient: Boolean @default(false)` — admin choisit si une note est partagée
- `Project.clientPortalToken: String? @unique` — token opaque pour magic-link sans password (optionnel, fallback)
- `Project.supportEndsAt: DateTime?` — calculé auto à `shippedAt + 14d`
- `Deliverable` — livrables exposés au client (kind: LINK / REPO / DEPLOYMENT / DESIGN / DOC / FILE, url, fileKey pour S3 plus tard)
- `SupportRequest` — tickets clients (status OPEN / IN_PROGRESS / RESOLVED / CLOSED)

Aucune migration DB à faire le jour où on lance le portail — tout est déjà là.

---

## 3. Pages à construire

### `/client/login`
- Champ email
- POST → Supabase magic-link
- Mail de retour avec lien `https://client.hulabe.com/auth/callback?code=...`
- Côté callback : si user.email matche au moins un `Lead` ayant `Project.length > 0` → autorisé. Sinon refus.

### `/client` (dashboard)
- Liste des projets du client
- Pour chaque : nom, status (avec PROJECT_STATUS_LABEL), date shipping prévue/effective, badge "Support actif" si dans les 14j
- CTA "Ouvrir un ticket" si la fenêtre support est active

### `/client/projects/[id]`
- Header : nom, status (timeline visuelle des étapes DRAFT → QUOTED → SIGNED → IN_PROGRESS → IN_REVIEW → SHIPPED)
- Section **Livrables** : liste des `Deliverable` `visibleToClient: true`, groupés par kind, chacun avec url cliquable
- Section **Updates** : liste des `Note` `visibleToClient: true` du projet (par ordre antéchrono)
- Section **Support** :
  - Si `supportEndsAt` est dans le futur ou s'il existe une `MaintenanceContract` (à créer plus tard) : bouton "Nouvelle demande"
  - Sinon : message "Fenêtre support expirée. Pour de la maintenance continue, écris à support@hulabe.com"

### `/client/projects/[id]/support`
- Formulaire création ticket (textarea + submit)
- Liste des tickets existants pour ce projet
- Le client peut commenter / clore son ticket

---

## 4. Server actions à écrire

```ts
// src/lib/client/actions.ts
async function openSupportRequest(formData) {
  const user = await requireClient();
  const projectId = formData.get("projectId");
  const project = await assertProjectBelongsToClient(projectId, user.email);

  // Block if support window expired and no maintenance contract
  if (project.supportEndsAt && project.supportEndsAt < new Date()) {
    throw new Error("Fenêtre support expirée");
  }

  await prisma.supportRequest.create({
    data: {
      projectId,
      body: formData.get("body"),
      createdById: user.id,
      createdByEmail: user.email,
    },
  });
  // log activity
  // notify admin via Resend
}
```

Notifs :
- Création ticket → email à `NOTIFICATION_EMAIL` (admin)
- Admin résout ticket → email au client
- Admin ajoute deliverable → email au client (option)
- Admin ajoute note `visibleToClient: true` → email au client (option)

---

## 5. Middleware update

Au moment du lancement du portail, on étend `src/middleware.ts` :

```ts
if (pathname.startsWith("/client")) {
  const { user } = await updateSession(req);
  if (!user && pathname !== "/client/login") return redirect("/client/login");
  // No admin email check — clients are non-admin authenticated users
  return supabaseResponse;
}
```

Et on ajoute `noindex` sur `/client/*` aussi.

---

## 6. Sous-domaine `client.hulabe.com`

Vercel rewrite (dans `next.config.mjs`) au moment du lancement :

```js
async rewrites() {
  return {
    beforeFiles: [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'client.hulabe.com' }],
        destination: '/client/:path*',
      },
    ],
  };
}
```

Et côté DNS : `CNAME client → cname.vercel-dns.com`. Vercel détecte automatiquement le subdomain et fait le SSL.

---

## 7. Design du portail

Réutilise les tokens de DESIGN.md (Builder's Shipyard) mais :
- Plus chaleureux que l'admin — c'est un espace client, pas un terminal
- Accent lime moins agressif (peut-être à 5% au lieu de 10%)
- Mono pour metadata uniquement, sans pour les sections principales
- Tone copy : "Voici où on en est", "Tu peux télécharger", pas "Lead status changed"

À shape / craft via impeccable au moment du build.

---

## 8. Roadmap d'intégration

1. **Now** ✅ : DB ready (Deliverable, SupportRequest, visibleToClient, supportEndsAt, clientPortalToken)
2. **Step 1** (1 jour) : middleware split, login page client, magic-link Supabase, dashboard `/client`
3. **Step 2** (1 jour) : page projet + livrables + updates + ticket
4. **Step 3** (0.5 jour) : notifications email (Resend) bidirectionnelles
5. **Step 4** (0.5 jour) : sous-domaine `client.hulabe.com` via rewrite + DNS
6. **Plus tard** :
   - Maintenance contracts (modèle DB + abonnement Stripe)
   - Upload de fichiers via Supabase Storage (le `fileKey` du Deliverable est déjà là)
   - Vue "milestones" / Gantt simple
   - Webhook Stripe pour facturation auto

---

## 9. Décisions à prendre quand on lance

- [ ] Subdomain `client.hulabe.com` ou route `hulabe.com/client` ?
- [ ] Notifications email opt-in/opt-out par client ?
- [ ] Slack/Discord webhook côté admin pour les nouveaux tickets ?
- [ ] Permettre au client de fermer ses propres tickets ?
- [ ] Public statut page par projet (bonus) ?
