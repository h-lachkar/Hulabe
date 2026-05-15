"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Globe, ShoppingBag, ShoppingCart, Wand2, Server, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionMarker } from "@/components/section-marker";
import { SERVICE_KEYS, type ServiceKey } from "@/types";

const ICONS: Record<ServiceKey, React.ComponentType<{ className?: string }>> = {
  vitrine: Globe,
  ecommerce: ShoppingCart,
  shopify: ShoppingBag,
  lovable: Wand2,
  saas: Server,
  mobile: Smartphone,
};

export function Services() {
  const t = useTranslations("services");
  const ti = useTranslations("services.items");

  return (
    <section id="services" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="container-page">
        <SectionMarker
          number="01"
          label={t("kicker")}
          title={
            <>
              {t("title")} <span className="text-lime">{t("titleAccent")}</span>
            </>
          }
          subtitle={t("subtitle")}
        />

        <ul className="border-t border-border">
          {SERVICE_KEYS.map((key, idx) => (
            <ServiceRow
              key={key}
              index={idx}
              serviceKey={key}
              title={ti(`${key}.title`)}
              tagline={ti(`${key}.tagline`)}
              price={ti(`${key}.price`)}
              duration={ti(`${key}.duration`)}
              tags={ti.raw(`${key}.tags`) as string[]}
            />
          ))}
        </ul>

        <p className="mt-6 text-xs text-muted-foreground sm:text-sm">
          <span className="text-lime">*</span> {t("disclaimer")}
        </p>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <a href="#simulator">
              {t("ctaSimulator")} <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ServiceRow({
  serviceKey,
  index,
  title,
  tagline,
  price,
  duration,
  tags,
}: {
  serviceKey: ServiceKey;
  index: number;
  title: string;
  tagline: string;
  price: string;
  duration: string;
  tags: string[];
}) {
  const reduce = useReducedMotion();
  const Icon = ICONS[serviceKey];

  return (
    <motion.li
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : index * 0.05, ease: [0.4, 0, 0.2, 1] }}
      className="group relative border-b border-border"
    >
      <a
        href="#simulator"
        className="grid items-start gap-3 px-2 py-6 transition-colors hover:bg-surface/40 sm:grid-cols-12 sm:gap-6 sm:px-3 sm:py-8"
      >
        {/* Number + icon */}
        <div className="flex items-center gap-3 sm:col-span-2 sm:gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-2 transition-colors group-hover:text-lime">
            → {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lime transition-colors group-hover:border-lime/40">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Title + tagline */}
        <div className="sm:col-span-5">
          <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-lime sm:text-2xl">
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{tagline}</p>
          {/* Mobile-only tags row */}
          <div className="mt-3 flex flex-wrap items-center gap-1 sm:hidden">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="mono">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tags — sm+ */}
        <div className="hidden flex-wrap items-center gap-1.5 sm:col-span-3 sm:flex">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="mono">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Price + duration + arrow */}
        <div className="flex items-center justify-between gap-3 sm:col-span-2 sm:flex-col sm:items-end sm:gap-2">
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">
            {price}
            <span className="ml-0.5 text-lime">*</span>
          </span>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
              {duration}
              <span className="ml-0.5 text-lime">*</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-2 transition-all group-hover:translate-x-0.5 group-hover:text-lime" />
          </div>
        </div>
      </a>

      {/* Lime left accent on hover */}
      <span
        className="pointer-events-none absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-lime transition-all duration-300 group-hover:h-12"
        aria-hidden
      />
    </motion.li>
  );
}
