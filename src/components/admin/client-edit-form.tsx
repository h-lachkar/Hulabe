"use client";

import * as React from "react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { ClientUser } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function ClientEditForm({
  client,
  action,
}: {
  client: ClientUser;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>;
}) {
  const t = useTranslations("admin.clients.form");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", client.id);
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) toast.error(res.error ?? t("error"));
      else toast.success(t("saved"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")}>
          <input
            name="name"
            defaultValue={client.name ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("company")}>
          <input
            name="company"
            defaultValue={client.company ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
        <Field label={t("phone")}>
          <input
            name="phone"
            defaultValue={client.phone ?? ""}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
        </Field>
      </div>
      <Field label={t("notes")}>
        <textarea
          name="notes"
          defaultValue={client.notes ?? ""}
          rows={3}
          className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          <Save className="h-3.5 w-3.5" />
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
