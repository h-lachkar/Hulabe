"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  assignClientToProject,
  unassignClientFromProject,
  assignAdminToProject,
  unassignAdminFromProject,
} from "@/lib/admin/assignment-actions";

export type AssignableEntity = {
  id: string;
  label: string;
  sublabel?: string;
};

type Variant = "client" | "admin";

type Props = {
  variant: Variant;
  projectId: string;
  /** Currently assigned entities */
  assigned: AssignableEntity[];
  /** All entities that can be added (will be filtered against `assigned`) */
  available: AssignableEntity[];
  /** UI labels — provided by the parent server component via i18n */
  labels: {
    title: string;
    addPlaceholder: string;
    add: string;
    empty: string;
    remove: string;
  };
};

export function AssignmentList({
  variant,
  projectId,
  assigned,
  available,
  labels,
}: Props) {
  const [picking, setPicking] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assigned.map((a) => a.id));
  const addable = available.filter((a) => !assignedIds.has(a.id));

  function onAdd() {
    if (!selectedId) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set(variant === "client" ? "clientId" : "adminId", selectedId);
    startTransition(async () => {
      const res = await (variant === "client"
        ? assignClientToProject(fd)
        : assignAdminToProject(fd));
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(labels.add);
        setSelectedId("");
        setPicking(false);
      }
    });
  }

  function onRemove(id: string) {
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set(variant === "client" ? "clientId" : "adminId", id);
    startTransition(async () => {
      const res = await (variant === "client"
        ? unassignClientFromProject(fd)
        : unassignAdminFromProject(fd));
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {labels.title}
        </p>
        {!picking && addable.length > 0 && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-lime"
          >
            <Plus className="h-3 w-3" /> {labels.add}
          </button>
        )}
      </div>

      {assigned.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {assigned.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{a.label}</p>
                {a.sublabel && (
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {a.sublabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                disabled={pending}
                className="ml-2 rounded-md p-1 text-muted-2 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title={labels.remove}
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
            <option value="">{labels.addPlaceholder}</option>
            {addable.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
                {a.sublabel ? ` — ${a.sublabel}` : ""}
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
