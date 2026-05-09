"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionMarker } from "@/components/section-marker";

const KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export function Faq() {
  const t = useTranslations("faq");
  const ti = useTranslations("faq.items");

  return (
    <section id="faq" className="relative scroll-mt-20 border-t border-border py-24 sm:py-32">
      <div className="container-page max-w-3xl">
        <SectionMarker number="05" label={t("kicker")} title={t("title")} />

        <Accordion type="single" collapsible className="w-full">
          {KEYS.map((k, idx) => (
            <AccordionItem
              key={k}
              value={k}
              className="group relative border-b border-border data-[state=open]:bg-surface/40 transition-colors rounded-md"
            >
              {/* Left lime tick when open */}
              <span
                className="pointer-events-none absolute left-0 top-1/2 h-0 w-0.5 -translate-y-1/2 rounded-full bg-lime transition-all duration-300 group-data-[state=open]:h-8"
                aria-hidden
              />
              <AccordionTrigger className="px-3 text-left text-base sm:text-lg group-data-[state=open]:text-foreground">
                <span className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{ti(`${k}.q`)}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pl-12 leading-relaxed">
                {ti(`${k}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
