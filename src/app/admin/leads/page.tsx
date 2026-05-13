import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LeadStatus, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import {
  formatPriceRange,
  LEAD_STATUS_COLOR,
  LEAD_STATUS_LABEL,
  SERVICE_LABEL,
  timeAgo,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; service?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const statusFilter = STATUSES.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined;
  const serviceFilter = params.service as ServiceType | undefined;
  const searchQ = params.q?.trim();

  const leads = await prisma.lead.findMany({
    where: {
      status: statusFilter,
      serviceType: serviceFilter,
      ...(searchQ
        ? {
            OR: [
              { email: { contains: searchQ, mode: "insensitive" } },
              { name: { contains: searchQ, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = await prisma.lead.groupBy({
    by: ["status"],
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<
    LeadStatus,
    number
  >;
  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader kicker="LEADS" title="Inbox." subtitle={`${leads.length} leads affichés`} />

      <div className="space-y-4 px-6 py-6 sm:px-10">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            href="/admin/leads"
            active={!statusFilter && !serviceFilter && !searchQ}
            count={totalCount}
          >
            All
          </FilterPill>
          {STATUSES.map((s) => (
            <FilterPill
              key={s}
              href={`/admin/leads?status=${s}`}
              active={statusFilter === s}
              count={countMap[s] ?? 0}
              colorClass={LEAD_STATUS_COLOR[s]}
            >
              {LEAD_STATUS_LABEL[s]}
            </FilterPill>
          ))}
        </div>

        {/* Search */}
        <form
          action="/admin/leads"
          method="get"
          className="flex w-full max-w-sm items-center gap-2"
        >
          <input
            type="text"
            name="q"
            defaultValue={searchQ}
            placeholder="Email ou nom…"
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-surface-2 px-3 text-xs font-mono uppercase tracking-wider text-foreground hover:bg-[#262626]"
          >
            Search
          </button>
        </form>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">Estimate</th>
                <th className="hidden px-4 py-3 text-left md:table-cell">Source</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Aucun lead avec ces filtres.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group cursor-pointer transition-colors hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <span
                          className={cn(
                            "inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                            LEAD_STATUS_COLOR[lead.status],
                          )}
                        >
                          {LEAD_STATUS_LABEL[lead.status]}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lead.name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <span className="font-mono text-xs text-foreground">
                          {lead.serviceType ? SERVICE_LABEL[lead.serviceType] : "—"}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <span className="font-mono text-xs tabular-nums text-foreground">
                          {formatPriceRange(lead.estimatedPriceMin, lead.estimatedPriceMax)}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {lead.source}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-2 group-hover:text-lime"
                      >
                        {timeAgo(lead.createdAt)}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function FilterPill({
  href,
  active,
  count,
  children,
  colorClass,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors",
        active
          ? colorClass ?? "border-lime bg-lime/10 text-lime"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">
        {count}
      </span>
    </Link>
  );
}
