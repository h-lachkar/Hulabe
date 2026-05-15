import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import {
  formatEUR,
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  SERVICE_LABEL,
  timeAgo,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLUMNS: ProjectStatus[] = [
  "DRAFT",
  "QUOTED",
  "SIGNED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "SHIPPED",
];

export default async function ProjectsPage() {
  await requireAdmin();

  const projects = await prisma.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    include: { lead: { select: { name: true, email: true } } },
  });

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col] = projects.filter((p) => p.status === col);
      return acc;
    },
    {} as Record<ProjectStatus, typeof projects>,
  );

  return (
    <>
      <PageHeader
        kicker="PIPELINE"
        title="Projects."
        subtitle={`${projects.length} projets actifs · archive masquée`}
      />

      <div className="overflow-x-auto px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex min-w-max gap-3">
          {COLUMNS.map((col) => (
            <div key={col} className="w-[280px] shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    PROJECT_STATUS_COLOR[col],
                  )}
                >
                  {PROJECT_STATUS_LABEL[col]}
                  <span className="rounded bg-bg/40 px-1 text-[10px] tabular-nums">
                    {grouped[col].length}
                  </span>
                </span>
              </div>
              <div className="space-y-2">
                {grouped[col].length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-surface/40 p-4 text-center text-xs text-muted-foreground">
                    —
                  </div>
                ) : (
                  grouped[col].map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/projects/${p.id}`}
                      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-lime/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.name}
                        </p>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-2" />
                      </div>
                      {p.lead && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {p.lead.name ?? p.lead.email}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-2">
                          {p.serviceType ? SERVICE_LABEL[p.serviceType] : "—"}
                        </span>
                        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                          {formatEUR(p.priceQuotedCents)}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                        {timeAgo(p.updatedAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
