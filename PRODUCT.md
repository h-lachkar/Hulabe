# Product

## Register

brand

## Users

Quatre personas qui partagent un point commun : ils décident vite et veulent un partenaire technique qui code, pas qui présente.

- **Founders solo / early-stage** — ils ont une idée, peu de cash, besoin d'un MVP en quelques semaines. Ils lisent IndieHackers, suivent des builders sur Twitter, ont peut-être déjà tenté Lovable ou Bubble. Ils choisissent vite et regardent les prix avant tout.
- **Freelances / consultants établis** — ils veulent une vitrine sérieuse, un portfolio qui convertit. Ils savent juger un design pro et détectent immédiatement le template générique.
- **PME / agences saturées** — managers ou fondateurs qui ont besoin d'un overflow technique réactif. Ils veulent un sous-traitant qui ne disparaît pas, qui a un process clair, qui livre dans les délais.
- **Migrations Lovable / no-code** — niche. Ils ont un MVP no-code qui plafonne (perfs, custom logic, scale). Ils cherchent quelqu'un qui sait passer en code propre sans tout refaire.

Contexte d'usage : ils arrivent sur la landing depuis une recherche, une recommandation Twitter ou un lien LinkedIn. Ils ont 90 secondes pour décider si Hulabe est sérieux. Ils scrollent sur mobile à 80% du temps. Ils veulent voir un prix et un délai en moins de 10 secondes.

## Product Purpose

Hulabe est un studio de dev (1 personne aujourd'hui, peut-être plus tard) qui vend cinq services packagés avec prix et délais affichés. La landing existe pour qu'un prospect qualifié remplisse le simulateur ou prenne un brief de 30 min — point.

Succès =

- Conversion landing → simulateur ou Cal.com > 3% sur trafic qualifié
- Le visiteur sort avec une fourchette de prix et une attente claire (sous 24h, sous 7 jours)
- Zéro brief perdu parce que la page n'a pas été comprise

À long terme, un portail client peut s'ajouter (suivi de projet, factures, livrables) — d'où le register hybride. Mais aujourd'hui le primary surface est 100% brand.

## Brand Personality

Builder, ship-fast, hédo.

- **Builder** — Hulabe est tenu par quelqu'un qui code. La voix est celle d'un dev qui a envoyé du soft, pas d'un commercial. On parle Stripe, Vercel, Supabase comme on parlerait clés à molette : on sait ce que ça fait.
- **Ship-fast** — l'urgence est une valeur, pas un défaut. "Démarrage sous 7 jours", "devis sous 24h" — c'est la promesse principale. Le site lui-même doit ressentir cette vitesse (pas d'animations gratuites qui ralentissent).
- **Hédo** — il y a un plaisir à shipper, à faire du code propre, à voir un projet sortir. La voix est chaude, pas robotique. On peut tutoyer en FR ("ton MVP", "on te recontacte"). On peut faire une vanne discrète sur Wix. On ne parle PAS de "passion" ni de "valeurs humaines".

Voix concrète :
- ✓ "Ton MVP Lovable rame ? On le passe en code propre."
- ✓ "Démarrage sous 7 jours. Pas de comité, pas de blabla."
- ✗ "Nous accompagnons votre transformation digitale."
- ✗ "Excellence opérationnelle au service de votre vision."

## Anti-references

- **Templates Wix / Squarespace / Webflow génériques** — hero stock photo + 3 cards alignées + section testimonials + CTA. Le moule "agence sur mesure 2018". Hulabe doit être visiblement custom-coded, pas no-code.
- **Agences digitales tape-à-l'œil** — sites Awwwards-bait avec cursor custom, scroll-jacking, BIG TYPE en horizontal, 3 minutes pour comprendre ce qu'ils vendent. Conversion zéro. Hulabe doit être stylé MAIS lisible en 5 secondes.
- **Corporate consultant** — bleu marine, photos de mains qui se serrent, "transformation digitale", "accompagnement sur-mesure". À éviter absolument même par accident.
- **Crypto/AI hype overdesign** — gradient mesh + glow néon + glass morphism + 3D blob qui tourne. Hulabe est pas une boîte AI, c'est un studio dev. Le lime peut faire du néon discret, jamais du show-off.

## Design Principles

1. **Honesty as a feature** — chaque écran montre un prix, un délai, un livrable. Pas d'adjectifs vagues ("optimisé", "premium"). La FAQ dit ce qu'on ne fait pas. La page de pricing est la page de vente.
2. **Practice what you preach** — le site doit lui-même être la démo. S'il rame, on perd. S'il a un layout shift, on perd. S'il met 200ms à répondre, on perd. Le visiteur doit sentir "ils savent coder" sans qu'on le dise.
3. **Show, don't tell** — au lieu d'écrire "on est rapides", on affiche "1-2 semaines" sur la carte. Au lieu de "code propre", on liste la stack (Next.js, TS, Tailwind, Supabase) en mono. Les preuves sont des chiffres et des stack badges, pas des phrases.
4. **Confident punctuation** — le point lime après "faster", après "hulabe" — c'est notre signature. Une seule ponctuation visuelle, parcimonieuse, mémorable. Pas de logos clients tape-à-l'œil, pas de testimonials inventés.
5. **Density over emptiness** — on remplit l'écran de signaux concrets (prix, durées, stack, étapes du process) plutôt que de poser un seul gros titre dans 1000px de blanc. C'est un site de dev pour des gens qui scannent vite, pas un manifeste.

## Accessibility & Inclusion

Cible : Lighthouse > 90 sur Accessibility (sans audit manuel exhaustif).

- Contraste AA au minimum sur tous les textes (le `--muted-foreground` actuel à 65% lightness sur fond `#0A0A0A` passe).
- Focus visible sur tous les éléments interactifs (déjà via `focus-visible:ring-2`).
- Labels sur tous les inputs, `aria-label` sur les boutons icon-only (header burger, dropdown lang).
- `prefers-reduced-motion` doit être respecté — toute animation framer-motion doit avoir un fallback statique.
- Pas de tests lecteur d'écran systématiques pour l'instant — on s'engage sur ce qu'on peut mesurer (Lighthouse) plutôt que sur ce qu'on ne testera pas.
