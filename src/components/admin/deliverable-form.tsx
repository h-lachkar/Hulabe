"use client";

import * as React from "react";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Upload, Link as LinkIcon, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const KINDS = ["TEXT", "LINK", "REPO", "DEPLOYMENT", "DESIGN", "DOC", "FILE"] as const;
type Kind = (typeof KINDS)[number];

const KIND_ICONS: Record<Kind, React.ComponentType<{ className?: string }>> = {
  TEXT: FileText,
  LINK: LinkIcon,
  REPO: LinkIcon,
  DEPLOYMENT: LinkIcon,
  DESIGN: Image,
  DOC: FileText,
  FILE: Upload,
};

/**
 * Deliverable creation form. Adapts UI based on selected kind:
 *   - TEXT  → title + description (markdown), no URL/file
 *   - LINK/REPO/DEPLOYMENT/DESIGN/DOC → title + url + optional description
 *   - FILE  → title + file picker (uploaded to Supabase Storage)
 */
export function DeliverableForm({
  projectId,
  action,
}: {
  projectId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const t = useTranslations("admin.projects.detail.deliverableForm");
  const [kind, setKind] = useState<Kind>("LINK");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("projectId", projectId);
    fd.set("kind", kind);
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(t("toastAdded"));
        formRef.current?.reset();
        setKind("LINK");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  const needsUrl = kind !== "TEXT" && kind !== "FILE";
  const needsFile = kind === "FILE";
  const needsBody = kind === "TEXT";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3 border-b border-border p-5">
      <div className="grid gap-2 sm:grid-cols-3">
        {/* Kind picker */}
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`kind.${k}`)}
            </option>
          ))}
        </select>
        {/* Title */}
        <input
          type="text"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2"
        />
      </div>

      {/* URL field (link kinds) */}
      {needsUrl && (
        <input
          type="url"
          name="url"
          required
          placeholder={t("urlPlaceholder")}
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      {/* File picker */}
      {needsFile && (
        <div className="rounded-md border border-dashed border-border bg-surface-2/40 p-3">
          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("filePicker")}
          </label>
          <input
            type="file"
            name="file"
            required
            className="mt-2 block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-lime file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-lime-dark"
          />
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
            {t("fileHint")}
          </p>
        </div>
      )}

      {/* Description / body */}
      <textarea
        name="description"
        rows={needsBody ? 4 : 2}
        required={needsBody}
        placeholder={needsBody ? t("bodyPlaceholder") : t("descriptionPlaceholder")}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            name="visibleToClient"
            defaultChecked
            className="h-3.5 w-3.5 rounded border border-border bg-surface accent-lime"
          />
          {t("visibleToClient")}
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          <Plus className="h-3.5 w-3.5" />
          {pending ? t("adding") : t("add")}
        </Button>
      </div>
    </form>
  );
}

export function DeliverableKindIcon({ kind, className }: { kind: string; className?: string }) {
  const Icon = KIND_ICONS[kind as Kind] ?? LinkIcon;
  return <Icon className={className} />;
}
