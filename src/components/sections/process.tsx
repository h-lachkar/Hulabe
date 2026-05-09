"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionMarker } from "@/components/section-marker";

const STEPS = ["1", "2", "3", "4"] as const;
const META = [
  { meta: "30 MIN" },
  { meta: "< 24H" },
  { meta: "1-8 SEMAINES" },
  { meta: "GO LIVE" },
];

export function Process() {
  const t = useTranslations("process");
  const ts = useTranslations("process.steps");
  const reduce = useReducedMotion();

  return (
    <section
      id="process"
      className="relative scroll-mt-20 border-t border-border py-24 sm:py-32"
    >
      <div className="container-page">
        <SectionMarker
          number="03"
          label={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Vertical rail — aligned at 16px from left */}
          <div
            className="pointer-events-none absolute left-4 top-6 bottom-6 w-px bg-border"
            aria-hidden
          />

          <ol className="space-y-3">
            {STEPS.map((s, idx) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: reduce ? 0 : -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: reduce ? 0 : 0.4,
                  delay: reduce ? 0 : idx * 0.08,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="group relative pl-12 sm:pl-16"
              >
                {/* Dot on rail — centered on rail */}
                <span
                  className="absolute left-4 top-7 flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-bg transition-colors group-hover:border-lime"
                  aria-hidden
                >
                  <span className="block h-1.5 w-1.5 rounded-full bg-muted-2 transition-colors group-hover:bg-lime" />
                </span>
                {/* Connector horizontal stub */}
                <span
                  className="pointer-events-none absolute left-5 top-[33px] hidden h-px w-6 bg-border sm:block"
                  aria-hidden
                />

                <div className="rounded-xl border border-border bg-surface p-6 transition-colors group-hover:border-lime/30 sm:p-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")} / {STEPS.length}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-lime">
                      {META[idx].meta}
                    </span>
                  </div>
                  <h3 className="mt-3 flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
                    {ts(`${s}.title`)}
                    <Check
                      className="h-4 w-4 text-lime opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {ts(`${s}.body`)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>

    </section>
  );
}
