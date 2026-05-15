import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ExternalLink, Mail, Phone, Folders } from "lucide-react";
import type { LeadStatus, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { getFormat, LEAD_STATUS_COLOR } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import {
  addLeadNote,
  createProjectFromLead,
  updateLeadStatus,
} from "@/lib/admin/actions";
import { Markdown } from "@/components/markdown";
import { AiScorePanel } from "@/components/admin/ai-score-panel";

export const dynamic = "force-dynamic";

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("admin.leads.detail");
  const {
    serviceLabel,
    leadStatusLabel,
    formatDate,
    formatDateTime,
    formatPriceRange,
    timeAgo,
  } = getFormat(locale);

  const [lead, notes, activity, projects] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.note.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.project.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!lead) notFound();

  return (
    <>
      <PageHeader
        kicker={`LEAD / ${lead.id.slice(0, 6).toUpperCase()}`}
        title={lead.name ?? lead.email}
        subtitle={t("receivedAgo", { ago: timeAgo(lead.createdAt), source: lead.source })}
        actions={
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Link>
        }
      />

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-10">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI score */}
          <AiScorePanel
            leadId={lead.id}
            leadEmail={lead.email}
            aiScore={lead.aiScore}
            aiReasoning={lead.aiReasoning}
            aiSuggestedReply={lead.aiSuggestedReply}
            aiNextAction={lead.aiNextAction}
            aiFlags={lead.aiFlags}
            aiModel={lead.aiModel}
            aiScoredAt={lead.aiScoredAt}
          />

          {/* Brief / payload */}
          <section className="rounded-xl border border-border bg-surface">
            <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              {t("brief")}
            </header>
            <dl className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label={t("fields.service")}>
                {lead.serviceType ? serviceLabel[lead.serviceType as ServiceType] : "—"}
              </Field>
              <Field label={t("fields.source")}>{lead.source}</Field>
              <Field label={t("fields.estimation")}>
                <span className="font-mono tabular-nums">
                  {formatPriceRange(lead.estimatedPriceMin, lead.estimatedPriceMax)}
                </span>
              </Field>
              <Field label={t("fields.timeline")}>{lead.timeline ?? "—"}</Field>
              <Field label={t("fields.budget")}>{lead.budget ?? "—"}</Field>
              <Field label={t("fields.locale")}>
                <span className="font-mono uppercase">{lead.locale}</span>
              </Field>
            </dl>
            {lead.message && (
              <div className="border-t border-border px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("message")}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-foreground">
                  {lead.message}
                </pre>
              </div>
            )}
            {lead.features.length > 0 && (
              <div className="border-t border-border px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("simulatorAnswers")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {lead.features.map((f) => (
                    <li
                      key={f}
                      className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-foreground"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-border bg-surface">
            <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              {t("notes")}
            </header>
            <form action={addLeadNote} className="border-b border-border p-5">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder={t("notePlaceholder")}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm">
                  {t("addNote")}
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
                    <Markdown source={n.body} />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {n.authorEmail ?? "—"} · {timeAgo(n.createdAt)}
                    </p>
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
          {/* Status changer */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("status")}
            </p>
            <p className="mt-2">
              <span
                className={cn(
                  "inline-flex rounded border px-2 py-0.5 font-mono text-xs uppercase tracking-wider",
                  LEAD_STATUS_COLOR[lead.status],
                )}
              >
                {leadStatusLabel[lead.status]}
              </span>
            </p>
            <form action={updateLeadStatus} className="mt-4 grid gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.filter((s) => s !== lead.status).map((s) => (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    className={cn(
                      "rounded-md border bg-surface-2 px-2 py-1.5 text-xs font-medium transition-colors",
                      "border-border text-foreground hover:border-lime/40 hover:text-lime",
                    )}
                  >
                    → {leadStatusLabel[s]}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("contact")}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-2 text-foreground hover:text-lime"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </a>
              </li>
              {lead.phone && (
                <li>
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-2 text-foreground hover:text-lime"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {lead.phone}
                  </a>
                </li>
              )}
            </ul>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-2">
              {t("createdOn", { date: formatDate(lead.createdAt) })}
            </p>
          </div>

          {/* Projects */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("relatedProjects")}
            </p>
            {projects.length === 0 ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">{t("noProjects")}</p>
                <form action={createProjectFromLead} className="mt-4 space-y-3">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder={t("projectNamePlaceholder")}
                    defaultValue={lead.name ? `${lead.name} — ${lead.serviceType ?? "Project"}` : ""}
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {lead.serviceType && (
                    <input type="hidden" name="serviceType" value={lead.serviceType} />
                  )}
                  <Button type="submit" size="sm" className="w-full">
                    <Folders className="h-3.5 w-3.5" />
                    {t("createProject")}
                  </Button>
                </form>
              </>
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
        </aside>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}
