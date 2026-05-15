"use client";

import { useTransition, useState } from "react";
import { RefreshCcw, Sparkles, Copy, Check } from "lucide-react";
import type { AiNextAction } from "@prisma/client";
import { rescoreLead } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/admin/format";

const ACTION_LABEL: Record<AiNextAction, string> = {
  SEND_QUOTE: "Envoyer devis",
  BOOK_CALL: "Caler un call",
  ASK_CLARIFICATION: "Demander des précisions",
  DECLINE_POLITELY: "Décliner poliment",
};

const ACTION_COLOR: Record<AiNextAction, string> = {
  SEND_QUOTE: "border-lime/30 bg-lime/10 text-lime",
  BOOK_CALL: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  ASK_CLARIFICATION: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  DECLINE_POLITELY: "border-red-500/30 bg-red-500/10 text-red-300",
};

type Props = {
  leadId: string;
  leadEmail: string;
  aiScore: number | null;
  aiReasoning: string | null;
  aiSuggestedReply: string | null;
  aiNextAction: AiNextAction | null;
  aiFlags: string[];
  aiModel: string | null;
  aiScoredAt: Date | null;
};

export function AiScorePanel({
  leadId,
  leadEmail,
  aiScore,
  aiReasoning,
  aiSuggestedReply,
  aiNextAction,
  aiFlags,
  aiModel,
  aiScoredAt,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onRescore() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("leadId", leadId);
      await rescoreLead(fd);
    });
  }

  async function copyReply() {
    if (!aiSuggestedReply) return;
    await navigator.clipboard.writeText(aiSuggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const scored = aiScore != null && aiScoredAt;

  return (
    <section className="rounded-xl border border-lime/20 bg-gradient-to-br from-lime/[0.03] to-transparent">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lime" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            AI lead scoring
          </h2>
        </div>
        <button
          type="button"
          onClick={onRescore}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-lime disabled:opacity-50"
        >
          <RefreshCcw className={cn("h-3 w-3", pending && "motion-safe:animate-spin")} />
          {pending ? "scoring…" : scored ? "re-score" : "score"}
        </button>
      </header>

      {!scored ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Pas encore évalué. Clique{" "}
            <span className="font-mono text-foreground">SCORE</span> pour lancer Claude.
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-2">
            Requiert ANTHROPIC_API_KEY défini en env.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Score
              </p>
              <p className="mt-1 flex items-baseline gap-2">
                <span
                  className={cn(
                    "font-mono text-4xl font-bold tabular-nums",
                    aiScore! >= 8
                      ? "text-lime"
                      : aiScore! >= 5
                        ? "text-foreground"
                        : "text-muted-2",
                  )}
                >
                  {aiScore}
                </span>
                <span className="font-mono text-sm text-muted-2">/ 10</span>
              </p>
            </div>
            {aiNextAction && (
              <span
                className={cn(
                  "shrink-0 inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  ACTION_COLOR[aiNextAction],
                )}
              >
                {ACTION_LABEL[aiNextAction]}
              </span>
            )}
          </div>

          {aiReasoning && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {aiReasoning}
            </p>
          )}

          {aiFlags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {aiFlags.map((f) => (
                <li
                  key={f}
                  className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {f}
                </li>
              ))}
            </ul>
          )}

          {aiSuggestedReply && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Suggestion de réponse
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyReply}
                    className="inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-lime"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "copié" : "copier"}
                  </button>
                  <a
                    href={`mailto:${leadEmail}?body=${encodeURIComponent(aiSuggestedReply)}`}
                    className="inline-flex items-center gap-1 rounded border border-lime/40 bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime hover:bg-lime/20"
                  >
                    envoyer
                  </a>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                {aiSuggestedReply}
              </p>
            </div>
          )}

          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-2">
            {aiModel ?? "claude"} · {timeAgo(aiScoredAt)}
          </p>
        </div>
      )}
    </section>
  );
}
