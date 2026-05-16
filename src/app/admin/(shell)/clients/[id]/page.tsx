import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Mail, Phone, Building, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { prisma } from "@/lib/prisma";
import { getFormat } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import {
  deleteClient,
  toggleClientActive,
  updateClient,
} from "@/lib/admin/client-actions";
import { DangerZone } from "@/components/admin/danger-zone";
import { ClientEditForm } from "@/components/admin/client-edit-form";
import { ResendInviteButton } from "@/components/admin/resend-invite-button";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const isOwner = admin.role === "OWNER";
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("admin.clients.detail");
  const { formatDate, timeAgo } = getFormat(locale);

  const client = await prisma.clientUser.findUnique({ where: { id } });
  if (!client) notFound();

  // Pull projects linked to this client's email
  const projects = await prisma.project.findMany({
    where: { lead: { email: client.email } },
    orderBy: { updatedAt: "desc" },
    include: { lead: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        kicker={`CLIENT / ${client.id.slice(0, 6).toUpperCase()}`}
        title={client.name ?? client.email}
        subtitle={client.company ?? client.email}
        actions={
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Link>
        }
      />

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-10">
        <div className="space-y-6 lg:col-span-2">
          {/* Status + actions */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  client.isActive
                    ? "border-lime/30 bg-lime/10 text-lime"
                    : "border-border bg-surface-2 text-muted-foreground",
                )}
              >
                {client.isActive ? t("active") : t("inactive")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <ResendInviteButton clientId={client.id} label={t("resendInvite")} />
                <form action={toggleClientActive}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
                  >
                    {client.isActive ? t("deactivate") : t("reactivate")}
                  </button>
                </form>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <KV label={t("invited")} value={client.invitedAt ? formatDate(client.invitedAt) : "—"} />
              <KV
                label={t("passwordSet")}
                value={client.passwordSetAt ? formatDate(client.passwordSetAt) : "—"}
              />
              <KV
                label={t("lastLogin")}
                value={client.lastLoginAt ? timeAgo(client.lastLoginAt) : "—"}
              />
              <KV label={t("created")} value={formatDate(client.createdAt)} />
            </dl>
          </div>

          {/* Edit */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("editTitle")}
            </h3>
            <ClientEditForm
              client={client}
              action={updateClient}
            />
          </div>
        </div>

        <aside className="space-y-6">
          {/* Contact */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("contact")}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-2 text-foreground hover:text-lime"
                >
                  <Mail className="h-3.5 w-3.5" /> {client.email}
                </a>
              </li>
              {client.phone && (
                <li>
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex items-center gap-2 text-foreground hover:text-lime"
                  >
                    <Phone className="h-3.5 w-3.5" /> {client.phone}
                  </a>
                </li>
              )}
              {client.company && (
                <li className="inline-flex items-center gap-2 text-foreground">
                  <Building className="h-3.5 w-3.5" /> {client.company}
                </li>
              )}
            </ul>
          </div>

          {/* Linked projects */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("projects")}
            </p>
            {projects.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("noProjects")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:border-lime/30"
                    >
                      <span className="truncate text-foreground">{p.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-2" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isOwner && (
            <DangerZone
              action={deleteClient}
              idField="clientId"
              id={client.id}
              entityLabel={client.name ?? client.email}
              isOwner={isOwner}
            />
          )}
        </aside>
      </div>
    </>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
