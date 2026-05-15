import Link from "next/link";
import { ArrowRight, Inbox, Folders, TrendingUp, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  formatEUR,
  formatPriceRange,
  LEAD_STATUS_COLOR,
  LEAD_STATUS_LABEL,
  SERVICE_LABEL,
  timeAgo,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    leadsTotal,
    leadsThisWeek,
    leadsNew,
    activeProjects,
    wonThisMonth,
    recentLeads,
    recentActivity,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.project.count({
      where: { status: { in: ["SIGNED", "IN_PROGRESS", "IN_REVIEW"] } },
    }),
    prisma.project.aggregate({
      where: {
        status: "SHIPPED",
        shippedAt: { gte: monthStart },
      },
      _sum: { priceFinalCents: true },
      _count: true,
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        lead: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        kicker="OVERVIEW"
        title="Dashboard."
        subtitle="Snapshot des leads, projets et conversion. Mis à jour à chaque page load."
      />

      <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-10">
        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Leads · TOTAL"
            value={leadsTotal}
            hint={`${leadsNew} nouveaux non traités`}
          />
          <StatCard
            label="Leads · 7 JOURS"
            value={leadsThisWeek}
            hint="dont 0 perdus"
            trend={
              leadsThisWeek > 0
                ? { value: `+${leadsThisWeek}`, positive: true }
                : undefined
            }
          />
          <StatCard
            label="Projets actifs"
            value={activeProjects}
            hint="signed · in progress · review"
          />
          <StatCard
            label="Won ce mois"
            value={formatEUR(wonThisMonth._sum.priceFinalCents ?? 0)}
            hint={`${wonThisMonth._count} projets shippés`}
          />
        </section>

        {/* Two columns: recent leads + recent activity */}
        <section className="grid gap-6 lg:grid-cols-5">
          {/* Recent leads */}
          <div className="lg:col-span-3 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-lime" />
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                  Recent leads
                </h2>
              </div>
              <Link
                href="/admin/leads"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-lime"
              >
                Voir tous <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                <Sparkles className="mx-auto mb-3 h-5 w-5 text-muted-2" />
                Pas encore de lead. La page n&apos;est peut-être pas encore en ligne.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2/40"
                    >
                      <span
                        className={cn(
                          "shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          LEAD_STATUS_COLOR[lead.status],
                        )}
                      >
                        {LEAD_STATUS_LABEL[lead.status]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lead.name ?? lead.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.serviceType ? SERVICE_LABEL[lead.serviceType] : "—"}
                          {" · "}
                          {formatPriceRange(lead.estimatedPriceMin, lead.estimatedPriceMax)}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-2">
                        {timeAgo(lead.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-lime" />
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                  Activity
                </h2>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                Pas encore d&apos;activité.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentActivity.map((a) => {
                  const target = a.project
                    ? { href: `/admin/projects/${a.project.id}`, label: a.project.name }
                    : a.lead
                      ? {
                          href: `/admin/leads/${a.lead.id}`,
                          label: a.lead.name ?? a.lead.email,
                        }
                      : null;
                  return (
                    <li key={a.id} className="px-5 py-3">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono uppercase tracking-wider text-lime">
                          {a.kind.replace(/_/g, " ").toLowerCase()}
                        </span>
                        {" · "}
                        {timeAgo(a.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-foreground line-clamp-2">{a.summary}</p>
                      {target && (
                        <Link
                          href={target.href}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-lime"
                        >
                          {target.label} <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Quick links */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/admin/leads"
            className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-lime/30"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Inbox
              </p>
              <p className="mt-1 text-base font-medium text-foreground">
                Traiter les nouveaux leads
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-2 transition-colors group-hover:text-lime" />
          </Link>
          <Link
            href="/admin/projects"
            className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-lime/30"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Pipeline
              </p>
              <p className="mt-1 text-base font-medium text-foreground">
                Voir les projets actifs
              </p>
            </div>
            <Folders className="h-4 w-4 text-muted-2 transition-colors group-hover:text-lime" />
          </Link>
          <a
            href="https://eu.posthog.com"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-lime/30"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Analytics
              </p>
              <p className="mt-1 text-base font-medium text-foreground">
                Ouvrir PostHog
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-2 transition-colors group-hover:text-lime" />
          </a>
        </section>
      </div>
    </>
  );
}
