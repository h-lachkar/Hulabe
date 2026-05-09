"use client";

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
  comingSoon?: boolean;
};

const CASES: Case[] = [
  {
    number: "01",
    title: "TBD",
    type: "TBD",
    pitch: "Placeholder — vrai cas client à venir.",
    stack: ["TBD"],
    href: null,
    comingSoon: true,
  },
  {
    number: "02",
    title: "TBD",
    type: "TBD",
    pitch: "Placeholder — vrai cas client à venir.",
    stack: ["TBD"],
    href: null,
    comingSoon: true,
  },
  {
    number: "03",
    title: "TBD",
    type: "TBD",
    pitch: "Placeholder — vrai cas client à venir.",
    stack: ["TBD"],
    href: null,
    comingSoon: true,
  },
];

export function CaseStudies() {
  const t = useTranslations("cases");

  return (
    <section
      id="cases"
      className="relative scroll-mt-20 border-t border-border py-24 sm:py-32"
    >
      <div className="container-page">
        <SectionMarker
          number="04"
          label={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c, idx) => {
            const inner = (
              <Card className="group relative flex h-full flex-col overflow-hidden card-hover">
                {/* Preview slot — when real screenshots arrive, swap this block. */}
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-surface-2">
                  <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
                  <div
                    className="pointer-events-none absolute -bottom-12 left-1/2 h-48 w-72 -translate-x-1/2 opacity-20 blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(163,230,53,0.45) 0%, transparent 70%)",
                    }}
                    aria-hidden
                  />
                  <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    CASE / {c.number}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="display text-6xl text-foreground/15 select-none">
                      {c.number}
                    </span>
                  </div>
                  {c.comingSoon && (
                    <div className="absolute bottom-4 right-4">
                      <Badge variant="mono">{t("comingSoon")}</Badge>
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

            const node = c.href ? (
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
              >
                {inner}
              </a>
            ) : (
              <div>{inner}</div>
            );

            return (
              <FadeIn key={idx} delay={idx * 0.06}>
                {node}
              </FadeIn>
            );
          })}
        </div>

        <p className="mt-10 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="inline-block h-px w-8 align-middle bg-border" />
          <span className="px-3">{t("soon")}</span>
          <span className="inline-block h-px w-8 align-middle bg-border" />
        </p>
      </div>
    </section>
  );
}
