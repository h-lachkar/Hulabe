"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Reusable in-view fade container. Respects prefers-reduced-motion. */
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
