"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Line =
  | { kind: "prompt"; cmd: string }
  | { kind: "ok"; text: string }
  | { kind: "info"; text: string }
  | { kind: "warn"; text: string }
  | { kind: "blank" };

export function Terminal({ className }: { className?: string }) {
  const t = useTranslations("terminal");
  const reduce = useReducedMotion();

  const SCRIPT = useMemo<Line[]>(
    () => [
      { kind: "prompt", cmd: t("cmd") },
      { kind: "info", text: t("line1") },
      { kind: "ok", text: t("line2") },
      { kind: "info", text: t("line3") },
      { kind: "ok", text: t("line4") },
      { kind: "ok", text: t("line5") },
      { kind: "info", text: t("line6") },
      { kind: "ok", text: t("line7") },
      { kind: "blank" },
      { kind: "warn", text: t("footer") },
    ],
    [t],
  );

  const [visible, setVisible] = useState(reduce ? SCRIPT.length : 0);

  useEffect(() => {
    if (reduce) return;
    if (visible >= SCRIPT.length) {
      // Restart loop after a pause
      const tm = setTimeout(() => setVisible(0), 4500);
      return () => clearTimeout(tm);
    }
    const delay =
      SCRIPT[visible].kind === "prompt" ? 250 : SCRIPT[visible].kind === "blank" ? 80 : 380;
    const tm = setTimeout(() => setVisible((v) => v + 1), delay);
    return () => clearTimeout(tm);
  }, [visible, reduce, SCRIPT]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-[#0E0E0E] font-mono text-[12px] leading-[1.7] shadow-[0_0_0_1px_rgba(163,230,53,0.08),0_24px_60px_-30px_rgba(163,230,53,0.18)] sm:text-[13px]",
        className,
      )}
      aria-hidden
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-3 py-2.5 sm:px-4">
        <span className="h-2 w-2 rounded-full bg-[#3F3F46] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#3F3F46] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#3F3F46] sm:h-2.5 sm:w-2.5" />
        <span className="ml-2 truncate text-[10px] uppercase tracking-wider text-muted-2 sm:ml-3 sm:text-[11px]">
          {t("title")}
        </span>
        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-lime">
          ● {t("live")}
        </span>
      </div>

      {/* Content */}
      <div className="min-h-[260px] p-4 sm:min-h-[320px] sm:p-5">
        {SCRIPT.slice(0, visible).map((line, i) => (
          <Row key={i} line={line} reduce={!!reduce} />
        ))}
        {/* Blinking cursor at end */}
        {visible >= SCRIPT.length && (
          <span className="ml-0 inline-block h-4 w-2 translate-y-0.5 bg-lime motion-safe:animate-pulse" />
        )}
      </div>
    </div>
  );
}

function Row({ line, reduce }: { line: Line; reduce: boolean }) {
  if (line.kind === "blank") return <div className="h-3" />;

  const content =
    line.kind === "prompt" ? (
      <>
        <span className="text-lime">~/hulabe</span>
        <span className="text-muted-2"> $ </span>
        <span className="text-foreground">{line.cmd}</span>
      </>
    ) : line.kind === "ok" ? (
      <span className="text-lime">{line.text}</span>
    ) : line.kind === "warn" ? (
      <span className="text-foreground">{line.text}</span>
    ) : (
      <span className="text-muted-foreground">{line.text}</span>
    );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.18 }}
      className="whitespace-pre-wrap"
    >
      {content}
    </motion.div>
  );
}
