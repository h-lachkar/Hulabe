"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendTemplateEmail } from "@/lib/admin/email-actions";

type Template = "WELCOME" | "QUOTE_SENT" | "PROJECT_UPDATE" | "FEEDBACK_REQUEST" | "CUSTOM";

const TEMPLATES: Template[] = [
  "WELCOME",
  "QUOTE_SENT",
  "PROJECT_UPDATE",
  "FEEDBACK_REQUEST",
  "CUSTOM",
];

type Props = {
  /** Recipient email (read-only in the form) */
  to: string;
  /** Optional recipient name to greet by */
  recipientName?: string;
  /** Optional project name to auto-include in subject/body */
  projectName?: string;
  /** Pass leadId or projectId for activity log */
  leadId?: string;
  projectId?: string;
  /** Trigger button label override */
  label?: string;
};

export function EmailSendButton(props: Props) {
  const t = useTranslations("admin.email");
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<Template>("CUSTOM");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("to", props.to);
    fd.set("template", template);
    if (props.recipientName) fd.set("recipientName", props.recipientName);
    if (props.projectName) fd.set("projectName", props.projectName);
    if (props.leadId) fd.set("leadId", props.leadId);
    if (props.projectId) fd.set("projectId", props.projectId);

    startTransition(async () => {
      const res = await sendTemplateEmail(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      setOpen(false);
    });
  }

  const needsBody = template === "PROJECT_UPDATE" || template === "CUSTOM";
  const needsSubject = template === "CUSTOM";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
      >
        <Mail className="h-3 w-3" /> {props.label ?? t("sendEmail")}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-lime/20 bg-surface p-5 ring-2 ring-lime/10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("sendEmailTo", { to: props.to })}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("template")}
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as Template)}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm"
          >
            {TEMPLATES.map((tpl) => (
              <option key={tpl} value={tpl}>
                {t(`templates.${tpl}`)}
              </option>
            ))}
          </select>
        </div>

        {needsSubject && (
          <div className="grid gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("subject")}
            </label>
            <input
              name="customSubject"
              required
              placeholder={t("subjectPlaceholder")}
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
        )}

        {needsBody && (
          <div className="grid gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("body")}
            </label>
            <textarea
              name="customBody"
              required
              rows={6}
              placeholder={t("bodyPlaceholder")}
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("ctaLabel")}
            </label>
            <input
              name="ctaLabel"
              placeholder={t("ctaLabelPlaceholder")}
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("ctaUrl")}
            </label>
            <input
              name="ctaUrl"
              type="url"
              placeholder="https://…"
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            <Send className="h-3.5 w-3.5" />
            {pending ? t("sending") : t("send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
