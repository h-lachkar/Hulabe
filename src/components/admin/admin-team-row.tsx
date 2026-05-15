"use client";

import { useState, useTransition } from "react";
import {
  Mail,
  Pencil,
  Trash2,
  RefreshCcw,
  Power,
  PowerOff,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import type { AdminUser, AdminRole } from "@prisma/client";
import {
  deleteAdmin,
  resendAdminInvite,
  setAdminActive,
  updateAdminProfile,
  type TeamActionResult,
} from "@/lib/admin/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate, timeAgo } from "@/lib/admin/format";

const ROLE_COLOR: Record<AdminRole, string> = {
  OWNER: "border-lime/30 bg-lime/10 text-lime",
  ADMIN: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  VIEWER: "border-border bg-surface-2 text-muted-foreground",
};

const ROLE_LABEL: Record<AdminRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  VIEWER: "Viewer",
};

type Props = {
  admin: AdminUser;
  isCurrent: boolean;
  invitedByLabel: string | null;
};

export function AdminTeamRow({ admin, isCurrent, invitedByLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(admin.name ?? "");
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [result, setResult] = useState<TeamActionResult | null>(null);

  function runAction(action: () => Promise<TeamActionResult>) {
    setResult(null);
    startTransition(async () => {
      const res = await action();
      setResult(res);
      if (res.ok) setEditing(false);
    });
  }

  function onSave() {
    const fd = new FormData();
    fd.append("id", admin.id);
    fd.append("name", name);
    fd.append("role", role);
    runAction(() => updateAdminProfile(fd));
  }

  function onResend() {
    const fd = new FormData();
    fd.append("id", admin.id);
    runAction(() => resendAdminInvite(fd));
  }

  function onToggle() {
    const fd = new FormData();
    fd.append("id", admin.id);
    fd.append("active", String(!admin.isActive));
    runAction(() => setAdminActive(fd));
  }

  function onDelete() {
    if (
      !confirm(
        `Supprimer définitivement ${admin.email} ? Cette action est irréversible (mais Supabase Auth garde le compte — il pourra être réinvité plus tard).`,
      )
    )
      return;
    const fd = new FormData();
    fd.append("id", admin.id);
    runAction(() => deleteAdmin(fd));
  }

  return (
    <li
      className={cn(
        "px-5 py-4 transition-colors",
        !admin.isActive && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name + role + you */}
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom"
                className="h-8 max-w-[200px] text-sm"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {admin.name ?? <span className="text-muted-foreground italic">Sans nom</span>}
              </p>
            )}
            {editing ? (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className="h-7 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            ) : (
              <span
                className={cn(
                  "inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  ROLE_COLOR[admin.role],
                )}
              >
                {ROLE_LABEL[admin.role]}
              </span>
            )}
            {isCurrent && (
              <span className="inline-flex rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                You
              </span>
            )}
            {!admin.isActive && (
              <span className="inline-flex rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-300">
                Inactif
              </span>
            )}
          </div>

          {/* Email + metadata */}
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
            {admin.email}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
            {admin.lastLoginAt
              ? `Dernière connexion ${timeAgo(admin.lastLoginAt)}`
              : admin.invitedAt
                ? `Invité ${timeAgo(admin.invitedAt)} · jamais connecté`
                : `Créé ${formatDate(admin.createdAt)}`}
            {invitedByLabel && ` · invité par ${invitedByLabel}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  setEditing(false);
                  setName(admin.name ?? "");
                  setRole(admin.role);
                }}
              >
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={onSave}>
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                disabled={pending}
                aria-label="Éditer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {admin.isActive && !admin.lastLoginAt && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onResend}
                  disabled={pending}
                  aria-label="Renvoyer l'invitation"
                  title="Renvoyer l'invitation"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onResend}
                disabled={pending || !admin.isActive}
                aria-label="Nouveau magic-link"
                title="Envoyer un nouveau magic-link"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onToggle}
                disabled={pending || isCurrent}
                aria-label={admin.isActive ? "Désactiver" : "Réactiver"}
                title={admin.isActive ? "Désactiver" : "Réactiver"}
              >
                {admin.isActive ? (
                  <PowerOff className="h-3.5 w-3.5" />
                ) : (
                  <Power className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onDelete}
                disabled={pending || isCurrent}
                aria-label="Supprimer"
                title="Supprimer"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {result && !result.ok && (
        <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {result.error}
        </p>
      )}
      {result?.ok && result.message && (
        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-lime">
          <Check className="h-3 w-3" />
          {result.message}
        </p>
      )}
    </li>
  );
}
