---
name: Hulabe
description: A builder's shipyard for a dev studio that prices, plans, and ships in plain sight.
colors:
  bg: "#0A0A0A"
  surface: "#141414"
  surface-2: "#1C1C1C"
  border: "#262626"
  foreground: "#FAFAFA"
  muted: "#A1A1AA"
  muted-2: "#71717A"
  voltage-lime: "#A3E635"
  voltage-lime-deep: "#84CC16"
  signal-red: "#EF4444"
  signal-amber: "#F59E0B"
typography:
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-large:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label-mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
  numeric-mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
  "32": "128px"
components:
  button-primary:
    backgroundColor: "{colors.voltage-lime}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.voltage-lime-deep}"
    textColor: "{colors.bg}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-emphasis:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "40px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  badge-mono:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.label-mono}"
  badge-lime:
    backgroundColor: "{colors.voltage-lime}"
    textColor: "{colors.bg}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.label-mono}"
---

# Design System: Hulabe

## 1. Overview

**Creative North Star: "The Builder's Shipyard"**

Hulabe's surface is a working shipyard at night. Sections are quays where projects are sized, scoped, and pushed out — the visitor walks past them in order: services, process, simulator, cases, FAQ, contact. Everything is dark steel and concrete (the layered neutrals from `#0A0A0A` to `#262626`), and the lime is the work-light overhead — visible exactly where the action is, never as decoration. Mono type runs alongside prose like the labels stenciled on a hull: prices, durations, stack stamps. Numbers are visible from across the dock.

The system rejects the showroom posture entirely. There are no glossy hero photos, no testimonial carousels, no "Trusted by 500+ teams" trust strips, no Wix-template hero hierarchy. It also rejects the agency-awards posture: no oversized horizontal type pretending to be a poster, no custom cursor, no scroll-jacking. Hulabe looks coded because it is — and the design's only job is to make that legible in 5 seconds. Density is a feature: a builder reads density as competence, not clutter.

**Key Characteristics:**
- Layered neutrals (4-step ramp from `#0A0A0A` to `#262626`) carry depth; shadows are forbidden as ambience.
- Voltage Lime (`#A3E635`) is rationed — accent, accent dot, primary CTA, focus rings; never a fill on more than ~10% of any viewport.
- Mono is reserved: prices, durations, stack badges, kicker labels (`SERVICES`, `PROCESS`, …). Never body copy.
- Display type is tracked tight (`-0.03em`) and weighted heavy (800) — confident, not decorative.
- One signature glow only: a single radial Voltage Lime wash behind the hero. No other ambient lighting on the page.
- Motion is choreographed but cheap: framer-motion entrances, scroll-driven fades, the simulator's step transitions. Always under 300ms, always with a reduced-motion fallback.

## 2. Colors

A four-layer industrial neutral ramp keyed to a single voltage accent. The palette is essentially black-on-black-on-black with a 5% slice of lime; restraint is what makes the lime feel like a signal instead of a decoration.

### Primary

- **Voltage Lime** (`#A3E635`): the only accent in the system. Reserved for primary CTAs (`Calculer mon devis`, `Voir mon estimation`), focus rings, the trailing `.` after the wordmark and after `Ship faster`, the kicker labels above sections (`SERVICES`, `PROCESS`), and the active-step bar in the simulator. Used as a fill almost never; used as a border or text color most of the time.
- **Voltage Lime Deep** (`#84CC16`): hover state of the primary button only. Never used as a default fill.

### Neutral

The neutral ramp does the work that shadows would do in a softer system. The four steps are deliberate; do not interpolate intermediate values.

- **Yard Black** (`#0A0A0A`): page background, primary button text. The deepest layer; nothing sits behind it.
- **Steel Surface** (`#141414`): cards, the simulator container, the contact form panel, the header when scrolled. The "object on the page" tone.
- **Inner Steel** (`#1C1C1C`): nested surfaces — option buttons inside the simulator, secondary button rest state, popover background. One step warmer than Steel Surface.
- **Hairline Border** (`#262626`): every divider in the system. Borders carry the depth that shadows are forbidden from carrying.

### Text Neutrals

- **Floodlight White** (`#FAFAFA`): primary text. Display, headlines, body, button text on dark backgrounds. Never `#fff`.
- **Workshop Mute** (`#A1A1AA`): secondary text, muted body, sub-headings, footer body. Used for any text where the role is "supporting", not "stating".
- **Deep Mute** (`#71717A`): tertiary metadata that should be visible but quiet — copyright lines, "Built in Next.js", micro-captions.

### Signal

- **Signal Red** (`#EF4444`): destructive states only — error toasts, validation messages. Never a brand color.
- **Signal Amber** (`#F59E0B`): warning states. Reserved; not present on the landing today.

### Named Rules

**The 10 Percent Rule.** Voltage Lime occupies no more than ~10% of any viewport. Audit by squinting: if lime is the first thing you see, you've used too much. The lime should land on what the user must do next, never on what they're reading.

**The Black-On-Black Rule.** Depth is built from the four-layer neutral ramp (`Yard Black → Steel Surface → Inner Steel → Hairline Border`). Never use a shadow to imply depth on the surface plane. Borders, contrast, and tonal step are the only legal depth tools.

**The No-Pure-Black, No-Pure-White Rule.** `#000` and `#fff` are both forbidden. The system's neutrals are tinted toward warm-cool zero. Pure values look harsh against the lime and break the industrial-not-sterile feel.

## 3. Typography

**Display Font:** Geist Sans (with `system-ui, sans-serif` fallback)
**Body Font:** Geist Sans (single-family system)
**Mono Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** Geist is technical without being clinical — it carries weight cleanly at 800 and stays readable at 14px. The Sans + Mono pair from the same family means body and metrics never look like they're from different authors. Both are loaded via `next/font` for zero CLS.

### Hierarchy

- **Display** (800, `clamp(2.75rem, 7vw, 5rem)`, `line-height 0.95`, `tracking -0.03em`): hero headline, section titles when given full weight (e.g. `Six packages, clear pricing.`). The trailing `.` is always Voltage Lime when it's the brand voice; otherwise plain.
- **Headline** (700, 36-40px desktop, 28-32px mobile, `tracking -0.02em`): section H2s — `Comment on bosse`, `Les questions qu'on reçoit le plus`. Below display, above titles.
- **Title** (600, 18-20px, `line-height 1.3`): card titles in services, process step titles, FAQ questions. Tight weight, near-flush tracking.
- **Body** (400, 16px, `line-height 1.6`): paragraph copy. Max line length 65–75 characters; never let body text run wider than a typographic measure.
- **Body Large** (400, 18px, `line-height 1.55`): hero subtitle, section subtitles. The "second voice" of the page.
- **Label Mono** (500, 12px, `letter-spacing 0.08em`, uppercase): kicker labels above each section (`SERVICES`, `PROCESS`, `FAQ`), trust line under the hero, footer column heads, badge text. Mono is the system's tag for "this is a label, not a sentence".
- **Numeric Mono** (600, 16-18px, `tracking normal`): prices (`800 – 2 500€`), durations on cards (`1-2 semaines`), the simulator result fourchette. Numbers are always mono so they read as data.

### Named Rules

**The Mono Marks Data Rule.** Geist Mono only ever wears one of three hats: a label (uppercase kicker), a price/duration (numeric), or a tech tag (stack badge). Never used for body copy. If it's a sentence, it's Sans.

**The Tight Display Rule.** Display weight is 800, not 700, and tracking is `-0.03em`, not `-0.02em`. The two values are non-negotiable; together they make the hero feel "compressed and confident" instead of "soft and big".

**The Lime Period Rule.** When the brand voice closes with `.`, that period is Voltage Lime. Used after `hulabe`, after `Ship faster`, and after any title where the page wants the user to feel "this is the punchline". Used at most twice per viewport; never on body text.

## 4. Elevation

The system is **flat by default with one signature glow.** Surfaces are layered tonally (`Yard Black → Steel Surface → Inner Steel`) and separated by `#262626` hairline borders. Shadows as ambient styling are forbidden — they would soften the industrial register the page is built on.

The single exception is the **hero halo**: a radial Voltage Lime wash (~20% opacity, 600px diameter, 80px blur) sitting behind the H1, a few hundred pixels above the fold. This is the page's only ambient glow. It reads as a work-light, not as decoration. A second glow may appear on the simulator's success state — a soft halo (`box-shadow: 0 0 0 1px rgba(163,230,53,0.4), 0 0 40px -8px rgba(163,230,53,0.25)`) around the result card — but only on that specific surface, only on success.

### Shadow Vocabulary

- **Hero halo** (radial gradient, not box-shadow): `radial-gradient(circle, #A3E635 0%, transparent 70%)` at ~20% opacity. One per page, behind the H1 only.
- **Result halo** (`box-shadow: 0 0 0 1px rgba(163,230,53,0.4), 0 0 40px -8px rgba(163,230,53,0.25)`): the simulator's final success card. Used nowhere else.

### Named Rules

**The Flat-By-Default Rule.** Cards, inputs, popovers, dropdowns, and dialogs are flat at rest. They sit at their tonal layer (`Steel Surface` for cards, `Inner Steel` for nested) and are bounded by a `1px` Hairline Border. Never add `box-shadow` to convey "this is a thing" — the border and tonal step already do that work.

**The One Glow Rule.** Voltage Lime glow appears at most twice on any single page, and never as ambient page lighting. The hero halo is the canonical instance; the simulator success halo is the conditional one. No third glow is permitted.

## 5. Components

### Buttons

- **Shape:** rounded `10px` (`{rounded.md}`), height `40px` default / `48px` large. No bevel, no inner shadow.
- **Primary:** Voltage Lime fill (`#A3E635`), Yard Black text (`#0A0A0A`), 600 weight. Hover swaps to Voltage Lime Deep (`#84CC16`). Used for the only "next action" on each section: `Calculer mon devis`, `Voir mon estimation`, `Suivant`. There is at most one primary button per viewport.
- **Secondary:** Inner Steel fill (`#1C1C1C`), Floodlight White text, `1px` Hairline Border. Hover lifts the border to a slightly warmer tone. Used for "the other option" — `Voir les services`, `Réserver un créneau`.
- **Ghost:** transparent fill, Floodlight text, no border. Hover shifts background to Inner Steel. Used for tertiary actions like the simulator `Retour` button.
- **Focus:** all variants share a `2px` Voltage Lime ring with `2px` offset against background. The ring is the system's accessibility signature; never override it locally.

### Cards

- **Corner Style:** `16px` radius (`{rounded.lg}`) for service / case / process cards; `24px` (`{rounded.xl}`) for the simulator container and the result panel.
- **Background:** Steel Surface (`#141414`) at rest. Nested surfaces (the option buttons inside simulator steps) drop to Inner Steel (`#1C1C1C`).
- **Border:** `1px` Hairline Border (`#262626`) always. On hover for interactive cards, the border shifts toward `rgba(163,230,53,0.4)` — a Voltage Lime ghost — and never to a full lime fill.
- **Shadow Strategy:** none. See §4.
- **Internal Padding:** `24px` (1.5rem) for service / case cards; `40px` (2.5rem) for the simulator and contact form. Never less than `16px`.

### Inputs / Fields

- **Style:** Steel Surface fill, `1px` Hairline Border, `10px` radius, `44px` height (touch-friendly). No inner shadow, no fake-bevel.
- **Focus:** `2px` Voltage Lime ring with `2px` offset. The border itself does not change color — the ring carries the state. Identical treatment for `<Input>`, `<Textarea>`, `<Checkbox>` (when checked → background fills lime).
- **Error:** Signal Red (`#EF4444`) text below the field, `aria-invalid` flagged. The input border itself does not redden — only the helper text and an `aria-invalid` ring.

### Chips / Badges

- **Mono Variant:** Inner Steel background, Floodlight text, mono uppercase, `letter-spacing 0.08em`. Used for stack tags (`Next.js`, `Stripe`), card type labels, durations.
- **Lime Variant:** rare. Voltage Lime fill, Yard Black text. Used only when a status is being celebrated (e.g. "New" or "Shipped"). Not present on the landing today; reserve for the case-study page.

### Navigation

- **Header:** transparent at top, switches to Yard Black with backdrop-blur (`bg-bg/80 backdrop-blur-md`) and a Hairline Border once the user scrolls past `8px`. Logo on the left, nav links centered, language switch + primary CTA on the right.
- **Nav links:** body weight, Workshop Mute color at rest, Floodlight on hover. No underline, no animation beyond color.
- **Mobile:** burger toggles a full-width sheet at Yard Black. Links stack at body-large size with `12px` vertical padding.

### Simulator (Signature Component)

The simulator is the page's central interactive surface and the only multi-step component. It carries unique conventions:

- **Container:** `24px` radius, Steel Surface, `40px` internal padding desktop / `24px` mobile.
- **Step indicator:** a row of 5 thin bars, `4px` tall, `9999px` radius. Active steps are Voltage Lime; inactive are Hairline Border. The progression is linear, never animated as a sweeping fill.
- **Option buttons:** Inner Steel at rest, `12px` radius, left-aligned content with a circular check mark on the right. Selected state swaps the border to Voltage Lime and the check mark fills lime. No tick animation beyond a 200ms color transition.
- **Step transitions:** framer-motion `x: 20 → 0`, `opacity: 0 → 1`, `200ms` duration. Identical curve forward and back.
- **Result state:** the success card adds the Result Halo (see §4) and a single `Sparkles` icon in a Voltage Lime tinted circle. The fourchette is rendered in Numeric Mono at 32-40px; this is the largest mono number on the entire site by design.

## 6. Do's and Don'ts

### Do:
- **Do** layer surfaces with the four-step neutral ramp (`#0A0A0A → #141414 → #1C1C1C → #262626`). That ramp is the system's depth language.
- **Do** keep Voltage Lime under ~10% of any viewport. It is the signal, not the surface.
- **Do** mono-set every price, duration, and stack tag. If it's a number or a tech name, it's mono.
- **Do** color the trailing `.` after `hulabe` and after `Ship faster` in Voltage Lime. The Lime Period is the brand's signature.
- **Do** keep display tracking at `-0.03em` and weight at 800. Loosening either breaks the "compressed and confident" feel the hero is built around.
- **Do** show price ranges and durations on every service card. The strategic principle from PRODUCT.md is "honesty as a feature" — the visual system enforces it.
- **Do** ensure every interactive surface has a visible Voltage Lime focus ring. The accessibility commitment is met through this single rule.

### Don't:
- **Don't** use `#000` or `#fff` anywhere. Pure values are harsh and break the industrial-not-sterile register.
- **Don't** drop ambient `box-shadow`s on cards, inputs, or popovers. The system is flat-by-default — borders and tonal step carry depth.
- **Don't** add a third glow. The hero halo and the simulator success halo are the only Voltage Lime glows in the system.
- **Don't** mono-set body copy. Mono is a label tag, not a paragraph voice.
- **Don't** ship the page with a stock-photo hero, "Trusted by" logo strip, or testimonial carousel. PRODUCT.md names "Templates Wix / Squarespace / Webflow génériques" as an anti-reference — those patterns are forbidden by the visual spec too.
- **Don't** do scroll-jacking, custom cursors, or oversized horizontal display type. PRODUCT.md names "Agences digitales tape-à-l'œil (BIG TYPE + cursor custom)" as an anti-reference. Awwwards-bait is out.
- **Don't** use corporate blue, gradient mesh, glass morphism, or 3D blob renders. The page is a shipyard, not a SaaS hype site.
- **Don't** put more than one primary button in a single viewport. If two CTAs feel necessary, the second is Secondary or Ghost.
- **Don't** animate scroll content for longer than 300ms or without a `prefers-reduced-motion` fallback. Ship-fast applies to the page itself.
