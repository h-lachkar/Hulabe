"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type InvoiceFormProject = {
  id: string;
  name: string;
  priceQuotedCents: number | null;
  leadName: string | null;
  leadEmail: string | null;
};

export type InvoiceFormInitial = {
  invoiceId?: string;
  projectId: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
  clientVatNumber?: string | null;
  taxRatePct?: number; // percent (e.g. 20)
  dueDays?: number;
  notes?: string | null;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceEuros: number;
  }>;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  initial: InvoiceFormInitial;
  projects?: InvoiceFormProject[]; // when present, lets user switch project (new invoice)
  mode: "create" | "edit";
};

export function InvoiceForm({ action, initial, projects, mode }: Props) {
  const t = useTranslations("admin.invoices.form");
  const [lines, setLines] = useState(initial.lines.length > 0 ? initial.lines : [
    { description: "", quantity: 1, unitPriceEuros: 0 },
  ]);
  const [projectId, setProjectId] = useState(initial.projectId);
  const [pending, startTransition] = useTransition();

  const subtotal = lines.reduce(
    (sum, l) => sum + l.quantity * Math.round(l.unitPriceEuros * 100),
    0,
  );
  const [taxRatePct, setTaxRatePct] = useState(initial.taxRatePct ?? 0);
  const tax = Math.round((subtotal * taxRatePct * 100) / 10000);
  const total = subtotal + tax;

  function addLine() {
    setLines((ls) => [...ls, { description: "", quantity: 1, unitPriceEuros: 0 }]);
  }
  function removeLine(idx: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));
  }
  function updateLine(idx: number, patch: Partial<(typeof lines)[number]>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function onPickProject(id: string) {
    setProjectId(id);
    const p = projects?.find((p) => p.id === id);
    if (p && lines.every((l) => l.description === "")) {
      setLines([
        {
          description: p.name,
          quantity: 1,
          unitPriceEuros: p.priceQuotedCents ? p.priceQuotedCents / 100 : 0,
        },
      ]);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Always include the controlled projectId + lines + taxRate
    form.set("projectId", projectId);
    form.set("taxRate", String(taxRatePct));
    lines.forEach((l, i) => {
      form.set(`lines[${i}][description]`, l.description);
      form.set(`lines[${i}][quantity]`, String(l.quantity));
      form.set(`lines[${i}][unitPrice]`, String(l.unitPriceEuros));
    });
    startTransition(async () => {
      try {
        await action(form);
        toast.success(mode === "create" ? t("createdToast") : t("savedToast"));
      } catch (err) {
        // Server actions that redirect throw NEXT_REDIRECT — that's a success.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error(err instanceof Error ? err.message : t("error"));
      }
    });
  }

  const selectedProject = projects?.find((p) => p.id === projectId);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial.invoiceId && (
        <input type="hidden" name="invoiceId" value={initial.invoiceId} />
      )}
      {!projects && (
        <input type="hidden" name="projectId" value={projectId} />
      )}

      {/* Project picker (only on create when projects passed) */}
      {projects && (
        <div className="grid gap-2">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("project")}
          </label>
          <select
            value={projectId}
            onChange={(e) => onPickProject(e.target.value)}
            required
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">{t("pickProject")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.leadName ? ` — ${p.leadName}` : p.leadEmail ? ` — ${p.leadEmail}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Client info */}
      <fieldset className="grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-2">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("billedTo")}
        </legend>
        <Field label={t("clientName")}>
          <input
            name="clientName"
            defaultValue={initial.clientName ?? selectedProject?.leadName ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("clientEmail")}>
          <input
            name="clientEmail"
            type="email"
            defaultValue={initial.clientEmail ?? selectedProject?.leadEmail ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("clientAddress")} className="md:col-span-2">
          <textarea
            name="clientAddress"
            rows={2}
            defaultValue={initial.clientAddress ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("clientVat")}>
          <input
            name="clientVatNumber"
            defaultValue={initial.clientVatNumber ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("dueDays")}>
          <input
            name="dueDays"
            type="number"
            min={0}
            max={365}
            defaultValue={initial.dueDays ?? 30}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono"
          />
        </Field>
      </fieldset>

      {/* Lines */}
      <fieldset className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("lineItems")}
        </legend>
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2">
            <input
              required={idx === 0}
              value={line.description}
              onChange={(e) => updateLine(idx, { description: e.target.value })}
              placeholder={t("descriptionPlaceholder")}
              className="col-span-12 rounded-md border border-border bg-bg px-3 py-2 text-sm md:col-span-6"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
              placeholder={t("qty")}
              className="col-span-3 rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono md:col-span-2"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={line.unitPriceEuros}
              onChange={(e) =>
                updateLine(idx, { unitPriceEuros: Number(e.target.value) || 0 })
              }
              placeholder={t("unitPrice")}
              className="col-span-7 rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono md:col-span-3"
            />
            <button
              type="button"
              onClick={() => removeLine(idx)}
              disabled={lines.length === 1}
              className="col-span-2 inline-flex items-center justify-center rounded-md border border-border bg-bg px-2 py-2 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 md:col-span-1"
              aria-label={t("removeLine")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-lime"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addLine")}
        </button>
      </fieldset>

      {/* Totals */}
      <div className="grid gap-3 rounded-xl border border-border bg-surface p-5 md:grid-cols-2">
        <div className="space-y-3">
          <Field label={t("taxRate")}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(Number(e.target.value) || 0)}
                className="w-24 rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </Field>
          <Field label={t("notes")}>
            <textarea
              name="notes"
              rows={3}
              defaultValue={initial.notes ?? ""}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <div className="space-y-2 self-start">
          <Total label={t("subtotal")} cents={subtotal} />
          {taxRatePct > 0 && (
            <Total label={`${t("tax")} (${taxRatePct}%)`} cents={tax} />
          )}
          <div className="border-t border-border pt-2">
            <Total label={t("grandTotal")} cents={total} large />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {mode === "create" ? <Send className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {pending ? t("saving") : mode === "create" ? t("create") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Total({ label, cents, large }: { label: string; cents: number; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-${large ? "sm" : "xs"} ${large ? "font-semibold" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span className={`font-mono ${large ? "text-lg font-bold" : "text-sm"} tabular-nums`}>
        {(cents / 100).toFixed(2)} €
      </span>
    </div>
  );
}
