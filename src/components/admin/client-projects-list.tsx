"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  assignClientToProject,
  unassignClientFromProject,
} from "@/lib/admin/assignment-actions";

export type ClientProjectsListProps = {
  clientId: string;
  /** Projects the client currently has access to (legacy + explicit) */
  assigned: { id: string; name: string; subtitle?: string | null }[];
  /** All non-archived projects for the picker */
  available: { id: string; name: string; subtitle?: string | null }[];
};

/**
 * Reverse of AssignmentList — used on the client detail page. Pick a project
 * to add this client to, or remove an existing membership.
 *
 * Note: this only manages EXPLICIT memberships. Legacy lead.email matches
 * cannot be "removed" here (only by deleting / changing the underlying lead).
 */
export function ClientProjectsList({
  clientId,
  assigned,
  available,
}: ClientProjectsListProps) {
  const t = useTranslations("admin.clients.detail.projectsList");
  const [picking, setPicking] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assigned.map((a) => a.id));
  const addable = available.filter((p) => !assignedIds.has(p.id));

  function onAdd() {
    if (!selectedId) return;
    const fd = new FormData();
    fd.set("projectId", selectedId);
    fd.set("clientId", clientId);
    startTransition(async () => {
      const res = await assignClientToProject(fd);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(t("added"));
        setSelectedId("");
        setPicking(false);
      }
    });
  }

  function onRemove(projectId: string) {
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("clientId", clientId);
    startTransition(async () => {
      const res = await unassignClientFromProject(fd);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("title")}
        </p>
        {!picking && addable.length > 0 && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-lime"
          >
            <Plus className="h-3 w-3" /> {t("add")}
          </button>
        )}
      </div>

      {assigned.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {assigned.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2"
            >
              <Link
                href={`/admin/projects/${p.id}`}
                className="flex min-w-0 items-center gap-2 text-sm text-foreground hover:text-lime"
              >
                <span className="truncate">{p.name}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-2" />
              </Link>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                disabled={pending}
                className="ml-2 rounded-md p-1 text-muted-2 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title={t("remove")}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {picking && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-lime/30 bg-lime/5 p-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-md border border-border bg-bg px-2 py-1.5 text-xs"
          >
            <option value="">{t("pickPlaceholder")}</option>
            {addable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.subtitle ? ` — ${p.subtitle}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedId || pending}
            className="rounded-md bg-lime px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setPicking(false);
              setSelectedId("");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
