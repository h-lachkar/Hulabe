"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/section-heading";
import { SectionMarker } from "@/components/section-marker";

type Case = {
  number: string;
  title: string;
  type: string;
  pitch: string;
  stack: string[];
  href: string | null;
  /** Optional: explicit screenshot path (e.g. /cases/rektads.png in /public).
   *  If null AND href is set, we auto-generate a screenshot via Microlink. */
  screenshotUrl?: string | null;
  comingSoon?: boolean;
};

/**
 * Auto-generate a preview screenshot via thum.io — free tier, no auth needed,
 * returns the PNG directly (no redirect). Replace with a local /public/cases/*.png
 * by setting `screenshotUrl` explicitly on the case for production quality.
 *
 * URL pattern: https://image.thum.io/get/width/{w}/crop/{h}/noanimate/{url}
 *   - width: max viewport width to capture
 *   - crop: max height (acts as a vertical crop from the top)
 *   - noanimate: disables animations on the target
 */
function thumScreenshot(url: string, width = 1280, crop = 800) {
  return `https://image.thum.io/get/width/${width}/crop/${crop}/noanimate/maxAge/6/${url}`;
}

// TODO côté toi: enrichir `pitch`, `type`, `stack` avec les vrais détails.
// Pour des previews stables et plus rapides, remplace `screenshotUrl: undefined`
// par un chemin local du genre `/cases/rektads.png` (et ajoute le PNG dans /public/cases/).
type CaseSeed = Omit<Case, "type" | "pitch"> & { slug: string };

const CASES_SEED: CaseSeed[] = [
  {
    slug: "rektads",
    number: "01",
    title: "RektAds",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    href: "https://rektads.com",
    screenshotUrl: "/cases/rektads.png",
  },
  {
    slug: "bcnImmobilier",
    number: "02",
    title: "BCN Immobilier",
    stack: ["Next.js", "CMS", "i18n"],
    href: "https://bcn-immobilier.com",
    screenshotUrl: "/cases/bcn-immobilier.png",
  },
  {
    slug: "yourProject",
    number: "03",
    title: "Your project",
    stack: [],
    href: null,
    comingSoon: true,
  },
];

export function CaseStudies() {
  const t = useTranslations("cases");
  const ti = useTranslations("cases.items");

  const CASES: Case[] = CASES_SEED.map((c) => ({
    ...c,
    type: ti(`${c.slug}.type`),
    pitch: ti(`${c.slug}.pitch`),
  }));

  return (
    <section
      id="cases"
      className="relative scroll-mt-20 border-t border-border py-14 sm:py-20"
    >
      <div className="container-page">
        <SectionMarker
          number="04"
          label={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c, idx) => (
            <FadeIn key={idx} delay={idx * 0.06}>
              <CaseItem c={c} viewLabel={t("viewProject")} comingSoonLabel={t("comingSoon")} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseItem({
  c,
  viewLabel,
  comingSoonLabel,
}: {
  c: Case;
  viewLabel: string;
  comingSoonLabel: string;
}) {
  const resolvedScreenshot =
    c.screenshotUrl ?? (c.href && !c.comingSoon ? thumScreenshot(c.href) : null);

  const host = c.href ? safeHost(c.href) : null;

  const inner = (
    <Card className="group relative flex h-full flex-col overflow-hidden card-hover">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-surface-2">
        {/* Always-present styled fallback (visible if image fails or before load) */}
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div
          className="hero-halo-bg-soft pointer-events-none absolute -bottom-12 left-1/2 h-48 w-72 -translate-x-1/2 opacity-25 blur-3xl"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="display text-6xl text-foreground/15 select-none">
            {c.number}
          </span>
        </div>

        {/* Real screenshot on top, with fade overlay */}
        {resolvedScreenshot && (
          <PreviewImage src={resolvedScreenshot} alt={`${c.title} — preview`} />
        )}

        {/* Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg/70 to-transparent" />
        <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-widest text-foreground">
          CASE / {c.number}
        </div>
        {host && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-foreground transition-colors group-hover:text-lime">
            {host}
          </div>
        )}
        {c.comingSoon && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="mono">{comingSoonLabel}</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between">
          <Badge variant="mono">{c.type}</Badge>
          {c.href && (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
          )}
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">{c.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.pitch}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {c.stack.map((s) => (
            <Badge key={s} variant="mono">
              {s}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );

  if (c.href) {
    return (
      <a
        href={c.href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${c.title} — ${viewLabel}`}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover object-top motion-safe:animate-[fadeIn_400ms_ease-out_both]"
    />
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}
