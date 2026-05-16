import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus, Users, UserCheck, UserX } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { prisma } from "@/lib/prisma";
import { getFormat } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { admin } = await requireAdmin();
  const isOwner = admin.role === "OWNER";
  const locale = await getLocale();
  const t = await getTranslations("admin.clients");
  const { formatDate, timeAgo } = getFormat(locale);

  const clients = await prisma.clientUser.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Count projects per client email (case-insensitive)
  const emails = clients.map((c) => c.email);
  const projectCounts = await prisma.project.groupBy({
    by: ["leadId"],
    _count: { _all: true },
    where: { lead: { email: { in: emails } } },
  });

  // Lookup leadId → email for join
  const leadEmails = await prisma.lead.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const leadIdToEmail = new Map(leadEmails.map((l) => [l.id, l.email]));
  const projectCountByEmail = projectCounts.reduce(
    (acc, row) => {
      if (row.leadId) {
        const email = leadIdToEmail.get(row.leadId);
        if (email) acc[email] = (acc[email] ?? 0) + row._count._all;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle", { count: clients.length })}
        actions={
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center gap-2 rounded-md bg-lime px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-lime-dark"
          >
            <Plus className="h-4 w-4" />
            {t("newClient")}
          </Link>
        }
      />

      <div className="px-4 py-6 sm:px-6 lg:px-10">
        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <Users className="mx-auto h-6 w-6 text-muted-2" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
            <Link
              href="/admin/clients/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-lime px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-lime-dark"
            >
              <Plus className="h-4 w-4" />
              {t("newClient")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-surface-2/40 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="px-4 py-3 text-left">{t("columns.client")}</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">{t("columns.company")}</th>
                  <th className="px-4 py-3 text-center">{t("columns.projects")}</th>
                  <th className="px-4 py-3 text-center">{t("columns.status")}</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">{t("columns.lastLogin")}</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell">{t("columns.created")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="block group"
                      >
                        <p className="text-sm font-medium text-foreground group-hover:text-lime">
                          {c.name ?? c.email}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{c.email}</p>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {c.company ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm tabular-nums text-foreground">
                      {projectCountByEmail[c.email] ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          c.isActive
                            ? "border-lime/30 bg-lime/10 text-lime"
                            : "border-border bg-surface-2 text-muted-foreground",
                        )}
                      >
                        {c.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {c.isActive ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-xs text-muted-foreground md:table-cell">
                      {c.lastLoginAt ? timeAgo(c.lastLoginAt) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-xs text-muted-foreground lg:table-cell">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
