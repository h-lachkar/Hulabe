"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  number: string;
  label: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
};

/**
 * Big mono chapter marker. Used at the top of every section.
 * Looks like "01 / SERVICES — six packages, clear pricing."
 */
export function SectionMarker({ number, label, title, subtitle, className }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn("mb-14", className)}
    >
      <div className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
        <span className="text-lime">{number}</span>
        <span className="h-px w-8 self-center bg-border sm:w-12" aria-hidden />
        <span className="text-foreground">{label}</span>
      </div>
      <h2 className="display mt-5 max-w-3xl text-4xl sm:text-5xl lg:text-[3.5rem]">{title}</h2>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      )}
    </motion.div>
  );
}
