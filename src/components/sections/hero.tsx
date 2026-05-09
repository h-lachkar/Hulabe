"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Terminal } from "@/components/terminal";

export function Hero() {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();
  const trust = t("trust").split(" · ");

  function v(delay: number) {
    return {
      initial: { opacity: 0, y: reduce ? 0 : 14 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: reduce ? 0 : 0.45, delay: reduce ? 0 : delay, ease: [0.4, 0, 0.2, 1] },
    } as const;
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      {/* Hero halo */}
      <div
        className="pointer-events-none absolute -top-40 -right-32 h-[820px] w-[820px] opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(163,230,53,0.55) 0%, rgba(163,230,53,0.18) 35%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-bg"
        aria-hidden
      />

      <div className="container-page relative pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left: text */}
          <div className="lg:col-span-7">
            <motion.p
              {...v(0)}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-lime motion-safe:animate-pulse" />
              {t("kicker")}
            </motion.p>
            <motion.h1
              {...v(0.06)}
              className="display text-[3rem] leading-[0.95] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
            >
              <span className="block">{t("titleLine1")}</span>
              <span className="block">
                {t("titleLine2")}
                <span className="text-lime">.</span>
              </span>
            </motion.h1>
            <motion.p
              {...v(0.14)}
              className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              {t("subtitle")}
            </motion.p>
            <motion.div
              {...v(0.22)}
              className="mt-8 flex flex-col items-start gap-3 sm:flex-row"
            >
              <Button asChild size="lg">
                <a href="#simulator">
                  {t("ctaPrimary")} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#services">{t("ctaSecondary")}</a>
              </Button>
            </motion.div>

            <motion.ul
              {...v(0.32)}
              className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs"
              aria-label={t("trust")}
            >
              {trust.map((item) => (
                <li key={item}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 backdrop-blur-sm">
                    <span className="h-1 w-1 rounded-full bg-lime" />
                    {item}
                  </span>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Right: terminal */}
          <motion.div {...v(0.18)} className="lg:col-span-5">
            <Terminal />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
