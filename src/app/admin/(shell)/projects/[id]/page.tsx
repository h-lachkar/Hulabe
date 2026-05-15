import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ExternalLink, Plus, Eye, EyeOff } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { getFormat, PROJECT_STATUS_COLOR } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import {
  addDeliverable,
  addProjectNote,
  replyToSupportRequest,
  updateProjectStatus,
} from "@/lib/admin/actions";
import { InviteToPortalButton } from "@/components/admin/invite-button";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-dynamic";

const STATUSES: ProjectStatus[] = [
  "DRAFT",
  "QUOTED",
  "SIGNED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "SHIPPED",
  "ARCHIVED",
];

const DELIVERABLE_KINDS = ["LINK", "REPO", "DEPLOYMENT", "DESIGN", "DOC", "FILE"] as const;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("admin.projects.detail");
  const {
    serviceLabel,
    projectStatusLabel,
    formatDate,
    formatDateTime,
    formatEUR,
    timeAgo,
  } = getFormat(locale);

  const [project, notes, activity, deliverables, supportRequests] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { lead: { select: { id: true, name: true, email: true } } },
    }),
    prisma.note.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.deliverable.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supportRequest.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!project) notFound();

  return (
    <>
      <PageHeader
        kicker={`PROJECT / ${project.id.slice(0, 6).toUpperCase()}`}
        title={project.name}
        subtitle={
          project.lead
            ? `${t("leadPrefix")}${project.lead.name ?? project.lead.email} · ${formatDate(project.createdAt)}`
            : `${t("standalone")} · ${formatDate(project.createdAt)}`
        }
        actions={
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("pipeline")}
          </Link>
        }
      />

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-10">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Deliverables */}
          <section className="rounded-xl border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              {t("deliverables")}
              <span className="text-[10px] text-muted-foreground">
                {t("deliverablesHint")}
              </span>
            </header>
            <form action={addDeliverable} className="border-b border-border p-5">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  name="kind"
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue="LINK"
                >
                  {DELIVERABLE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder={t("titlePlaceholder")}
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2"
                />
                <input
                  type="url"
                  name="url"
                  placeholder={t("urlPlaceholder")}
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-3"
                />
              </div>
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  {t("add")}
                </Button>
              </div>
            </form>
            {deliverables.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("noDeliverables")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {deliverables.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 inline-block rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {d.kind}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      {d.url && (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 truncate font-mono text-xs text-muted-foreground hover:text-lime"
                        >
                          {d.url} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {d.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {timeAgo(d.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-border bg-surface">
            <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              {t("notes")}
            </header>
            <form action={addProjectNote} className="border-b border-border p-5">
              <input type="hidden" name="projectId" value={project.id} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder={t("notePlaceholder")}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name="visibleToClient"
                    className="h-3.5 w-3.5 rounded border-border bg-surface text-lime"
                  />
                  {t("visibleToClient")}
                </label>
                <Button type="submit" size="sm">
                  {t("add")}
                </Button>
              </div>
            </form>
            {notes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("noNotes")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notes.map((n) => (
                  <li key={n.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Markdown source={n.body} />
                      </div>
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          n.visibleToClient
                            ? "border-lime/30 bg-lime/10 text-lime"
                            : "border-border bg-surface-2 text-muted-foreground",
                        )}
                      >
                        {n.visibleToClient ? (
                          <>
                            <Eye className="h-3 w-3" /> {t("client")}
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> {t("internal")}
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {n.authorEmail ?? "—"} · {timeAgo(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Support tickets */}
          <section className="rounded-xl border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              <span>{t("supportTickets")}</span>
              <span className="text-[10px] text-muted-foreground">
                {supportRequests.length} {t("totalSuffix")}
              </span>
            </header>
            {supportRequests.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("noTickets")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {supportRequests.map((req) => (
                  <li key={req.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex-1 text-sm text-foreground whitespace-pre-wrap">
                        {req.body}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          req.status === "OPEN"
                            ? "border-lime/30 bg-lime/10 text-lime"
                            : req.status === "IN_PROGRESS"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                              : "border-border bg-surface-2 text-muted-foreground",
                        )}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {req.createdByEmail ?? t("client")} · {timeAgo(req.createdAt)}
                    </p>
                    {req.status !== "RESOLVED" && req.status !== "CLOSED" && (
                      <form action={replyToSupportRequest} className="mt-3 space-y-2">
                        <input type="hidden" name="requestId" value={req.id} />
                        <textarea
                          name="reply"
                          rows={3}
                          required
                          placeholder={t("replyPlaceholder")}
                          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="submit"
                            name="status"
                            value="IN_PROGRESS"
                            className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground hover:border-lime/40 hover:text-lime"
                          >
                            {t("replyInProgress")}
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="RESOLVED"
                            className="rounded-md bg-lime px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-lime-dark"
                          >
                            {t("replyResolve")}
                          </button>
                        </div>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Activity */}
          <section className="rounded-xl border border-border bg-surface">
            <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              {t("timeline")}
            </header>
            {activity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("noActivity")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-lime">
                      {a.kind.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{a.summary}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {formatDateTime(a.createdAt)}
                      {a.authorEmail && ` · ${a.authorEmail}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("status")}
            </p>
            <p className="mt-2">
              <span
                className={cn(
                  "inline-flex rounded border px-2 py-0.5 font-mono text-xs uppercase tracking-wider",
                  PROJECT_STATUS_COLOR[project.status],
                )}
              >
                {projectStatusLabel[project.status]}
              </span>
            </p>
            <form action={updateProjectStatus} className="mt-4 grid gap-2">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.filter((s) => s !== project.status).map((s) => (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-lime/40 hover:text-lime"
                  >
                    → {projectStatusLabel[s]}
                  </button>
                ))}
              </div>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("pricing")}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("quoted")}</dt>
                <dd className="font-mono tabular-nums">{formatEUR(project.priceQuotedCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("final")}</dt>
                <dd className="font-mono tabular-nums">{formatEUR(project.priceFinalCents)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("details")}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("service")}</dt>
                <dd className="font-mono">
                  {project.serviceType ? serviceLabel[project.serviceType] : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("started")}</dt>
                <dd className="font-mono">{formatDate(project.startedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("shipped")}</dt>
                <dd className="font-mono">{formatDate(project.shippedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("supportUntil")}</dt>
                <dd className="font-mono">{formatDate(project.supportEndsAt)}</dd>
              </div>
            </dl>
          </div>

          {project.lead && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("leadSource")}
              </p>
              <Link
                href={`/admin/leads/${project.lead.id}`}
                className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:border-lime/30"
              >
                <span className="truncate text-foreground">
                  {project.lead.name ?? project.lead.email}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-2" />
              </Link>
              <div className="mt-4">
                <InviteToPortalButton projectId={project.id} />
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                  {t("magicLinkHint", { email: project.lead.email })}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
