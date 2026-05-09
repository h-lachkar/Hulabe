"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  kicker: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  maxWidth?: string;
  className?: string;
};

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "left",
  maxWidth = "max-w-2xl",
  className,
}: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "mb-12",
        maxWidth,
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-lime">
        <span className="h-1.5 w-1.5 rounded-full bg-lime" />
        {kicker}
      </p>
      <h2 className="display text-4xl sm:text-5xl">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      )}
    </motion.div>
  );
}

/* ---------- Reusable in-view container ---------- */

export function FadeIn({
  children,
  delay = 0,
  className,
  y = 12,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
