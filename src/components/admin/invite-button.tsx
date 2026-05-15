"use client";

import { useState, useTransition } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inviteClientToPortal, type InviteResult } from "@/lib/admin/actions";

export function InviteToPortalButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<InviteResult | null>(null);

  function onClick() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("projectId", projectId);
      const res = await inviteClientToPortal(fd);
      setResult(res);
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onClick}
        disabled={pending}
        className="w-full"
      >
        <Mail className="h-3.5 w-3.5" />
        {pending ? "Envoi…" : "Inviter au portail"}
      </Button>

      {result?.ok && (
        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-lime">
          <Check className="h-3 w-3" />
          Envoyé à {result.sentTo}
        </p>
      )}
      {result && !result.ok && (
        <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {result.error}
        </p>
      )}
    </div>
  );
}
