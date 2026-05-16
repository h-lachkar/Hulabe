"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/admin/client-actions";

export function ClientCreateForm() {
  const t = useTranslations("admin.clients.form");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createClient(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(t("created"));
      if (res.message) {
        router.push(`/admin/clients/${res.message}`);
      } else {
        router.push("/admin/clients");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6">
      <Field label={t("email")} required>
        <input
          name="email"
          type="email"
          required
          placeholder="client@example.com"
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")}>
          <input
            name="name"
            placeholder="Jane Doe"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("company")}>
          <input
            name="company"
            placeholder="Acme Inc."
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("phone")}>
          <input
            name="phone"
            type="tel"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
      </div>
      <Field label={t("notes")}>
        <textarea
          name="notes"
          rows={3}
          placeholder={t("notesPlaceholder")}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="sendInvite"
          defaultChecked
          className="h-4 w-4 rounded border border-border bg-bg accent-lime"
        />
        {t("sendInvite")}
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <UserPlus className="h-4 w-4" />
          {pending ? t("creating") : t("create")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
