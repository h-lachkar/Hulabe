"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { resendClientInvite } from "@/lib/admin/client-actions";

export function ResendInviteButton({ clientId, label }: { clientId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    const fd = new FormData();
    fd.set("clientId", clientId);
    startTransition(async () => {
      const res = await resendClientInvite(fd);
      if (!res.ok) toast.error(res.error);
      else toast.success(res.message ?? label);
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent disabled:opacity-50"
    >
      <Mail className="h-3 w-3" /> {label}
    </button>
  );
}
