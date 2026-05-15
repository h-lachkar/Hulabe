"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const FEATURES = [
  "quote24h",
  "fastKickoff",
  "fixedPrice",
  "directContact",
  "ownsCode",
  "support14d",
] as const;

/**
 * Hero-right visual — replaces the old terminal mock with a sales-focused
 * "What's included" card. Lists concrete deliverables, not code.
 */
export function WhatsIncluded({ className }: { className?: string }) {
  const t = useTranslations("included");
  const reduce = useReducedMotion();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2/40 p-6 shadow-[0_0_0_1px_rgba(163,230,53,0.08),0_24px_60px_-30px_rgba(163,230,53,0.18)] sm:p-8 ${className ?? ""}`}
    >
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(163,230,53,0.6) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-lime">
          <Sparkles className="h-3 w-3" />
          {t("badge")}
        </div>
      </div>

      <h3 className="relative mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("title")}
      </h3>

      {/* Feature list */}
      <ul className="relative mt-5 space-y-3">
        {FEATURES.map((key, idx) => (
          <motion.li
            key={key}
            initial={{ opacity: 0, x: reduce ? 0 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: reduce ? 0 : 0.35,
              delay: reduce ? 0 : idx * 0.07,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="flex items-start gap-3"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime/40 bg-lime/15">
              <Check className="h-3 w-3 text-lime" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{t(`${key}.title`)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(`${key}.body`)}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      {/* Footer stat */}
      <div className="relative mt-6 flex items-baseline justify-between border-t border-border pt-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("priceLabel")}
          </p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
            {t("priceValue")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("timelineLabel")}
          </p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
            {t("timelineValue")}
          </p>
        </div>
      </div>
    </div>
  );
}
