# Hulabe — Assets de marque

## Structure

```
hulabe-assets/
├── logos/        # SVG vectoriels (à privilégier)
└── png/          # PNG rasterisés haute qualité
```

## Logos

### Logo complet
- `logos/hulabe-logo-dark.svg` — Pour fonds sombres (texte blanc)
- `logos/hulabe-logo-light.svg` — Pour fonds clairs (texte noir)

### Icône seule
- `logos/hulabe-icon.svg` — Icône lime (principal, pour app icon, avatar)
- `logos/hulabe-icon-dark.svg` — Icône sombre (alternative)
- `logos/favicon.svg` — Optimisée pour 32x32

## PNG

### Logo complet (3 densités)
- `png/hulabe-logo-dark@1x.png` (217px)
- `png/hulabe-logo-dark@2x.png` (434px)
- `png/hulabe-logo-dark@3x.png` (651px)
- Même chose pour `light`

### Icône
- `png/hulabe-icon-256.png` / `512.png` / `1024.png`
- `png/hulabe-icon-dark-256.png` / `512.png`

### Favicons
- `png/favicon.ico` — Multi-résolution (16/32/48/64)
- `png/favicon-16.png` / `32.png` / `48.png` / `64.png`
- `png/apple-touch-icon-180.png` — Pour iOS
- `png/apple-touch-icon-512.png` — Pour PWA

## Couleurs

- **Lime** : `#A3E635` (accent principal)
- **Black** : `#0A0A0A` (fond sombre)
- **White** : `#FAFAFA` (texte clair)
- **Surface** : `#141414` (cartes, surfaces)
- **Border** : `#262626` (bordures)
- **Muted** : `#A1A1AA` (texte secondaire)

## Typographie

- **Geist Sans** — Tous les textes
- **Geist Mono** — Prix, code, métriques

Téléchargeable gratuitement : https://vercel.com/font

## Usage

1. **Web** : utilise les SVG (parfaits à toutes tailles, légers)
2. **Réseaux sociaux** : utilise les PNG haute résolution
3. **Favicon** : utilise `favicon.ico` + référence `favicon.svg` en HTML pour les navigateurs modernes
4. **iOS app icon** : `apple-touch-icon-180.png`

## HTML de référence

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png">
```
