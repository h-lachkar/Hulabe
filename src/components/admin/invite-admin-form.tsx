"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { inviteAdmin, type TeamActionResult } from "@/lib/admin/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteAdminForm() {
  const tc = useTranslations("auth.common");
  const ti = useTranslations("admin.team.inviteForm");
  const tr = useTranslations("admin.team.row.roles");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<TeamActionResult | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ADMIN");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("name", name);
      fd.append("role", role);
      const res = await inviteAdmin(fd);
      setResult(res);
      if (res.ok) {
        setEmail("");
        setName("");
        setRole("ADMIN");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1 space-y-1.5">
          <Label htmlFor="invite-email">{tc("emailLabel")}</Label>
          <Input
            id="invite-email"
            type="email"
            required
            placeholder="alice@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-1 space-y-1.5">
          <Label htmlFor="invite-name">{ti("nameLabel")}</Label>
          <Input
            id="invite-name"
            type="text"
            placeholder={ti("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1 space-y-1.5">
          <Label htmlFor="invite-role">{ti("roleLabel")}</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="OWNER">{tr("OWNER")}</option>
            <option value="ADMIN">{tr("ADMIN")}</option>
            <option value="VIEWER">{ti("viewerOption")}</option>
          </select>
        </div>
      </div>

      {result && !result.ok && (
        <p className="inline-flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-lime">
          <Check className="h-3 w-3" />
          {result.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !email}>
          {pending ? ti("submitting") : ti("submit")}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
