"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  /** Server action expecting `{ leadId | projectId, confirm: "DELETE" }` */
  action: (formData: FormData) => Promise<void>;
  /** Field name to pass the id under (e.g. "leadId", "projectId", "invoiceId", "clientId") */
  idField: "leadId" | "projectId" | "invoiceId" | "clientId";
  /** The entity id */
  id: string;
  /** Short label of the entity to type to confirm — e.g. "Acme Inc." */
  entityLabel: string;
  /** Hidden behind an OWNER role gate on the server. Only render when OWNER. */
  isOwner: boolean;
};

/**
 * Two-step destructive delete confirmation.
 * 1. Click "Delete" → opens an inline confirm panel
 * 2. User must type "DELETE" exactly to enable the red button
 * 3. Submit calls the server action
 *
 * Only shown to OWNER admins (controlled by parent).
 */
export function DangerZone({ action, idField, id, entityLabel, isOwner }: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin.danger");

  if (!isOwner) return null;

  const canSubmit = typed === "DELETE" && !isPending;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    const fd = new FormData();
    fd.set(idField, id);
    fd.set("confirm", "DELETE");
    startTransition(async () => {
      try {
        await action(fd);
        // Server action redirects — toast may not show.
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {t("delete")}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-destructive">{t("title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("warning", { entity: entityLabel })}
          </p>

          <label className="mt-3 block text-xs text-muted-foreground">
            {t("typeToConfirm")}{" "}
            <code className="font-mono font-semibold text-destructive">DELETE</code>
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            placeholder="DELETE"
            className="mt-1.5 w-full rounded-md border border-border bg-bg px-2 py-1.5 font-mono text-sm focus-visible:border-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
          />

          <div className="mt-3 flex items-center gap-2">
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={!canSubmit}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isPending ? t("deleting") : t("confirmDelete")}
            </Button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
