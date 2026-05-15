import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  LifeBuoy,
  Rocket,
} from "lucide-react";
import type { DeliverableKind, ProjectStatus } from "@prisma/client";
import {
  getClientProject,
  isInSupportWindow,
  requireClient,
} from "@/lib/client/auth";
import { openSupportRequest } from "@/lib/client/actions";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import {
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  SERVICE_LABEL,
  formatDate,
  formatDateTime,
  timeAgo,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { prisma } = await import("@/lib/prisma");
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: project ? `${project.name} · Hulabe` : "Projet · Hulabe",
    robots: { index: false, follow: false },
  };
}

const ALL_STATUSES: ProjectStatus[] = [
  "DRAFT",
  "QUOTED",
  "SIGNED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "SHIPPED",
];

const KIND_ICON: Record<DeliverableKind, React.ComponentType<{ className?: string }>> = {
  LINK: Link2,
  REPO: Code2,
  DEPLOYMENT: Rocket,
  DESIGN: ImageIcon,
  DOC: FileText,
  FILE: FileText,
};

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireClient();
  const { id } = await params;
  const project = await getClientProject(id, user.email!);
  if (!project) notFound();

  const inSupport = isInSupportWindow(project.supportEndsAt);
  const currentStepIdx = Math.max(0, ALL_STATUSES.indexOf(project.status));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/client"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-lime"
      >
        <ArrowLeft className="h-3 w-3" />
        Tes projets
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {project.serviceType ? SERVICE_LABEL[project.serviceType] : "Projet"}
          </p>
          <h1 className="display text-3xl sm:text-4xl">{project.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded border px-2 py-0.5 font-mono text-xs uppercase tracking-wider",
                PROJECT_STATUS_COLOR[project.status],
              )}
            >
              {PROJECT_STATUS_LABEL[project.status]}
            </span>
            {inSupport && (
              <span className="inline-flex rounded border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-lime">
                Support actif · jusqu&apos;au {formatDate(project.supportEndsAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
          Avancement
        </h2>
        <ol className="mt-6 grid gap-2 sm:grid-cols-6">
          {ALL_STATUSES.map((s, idx) => {
            const reached = idx <= currentStepIdx;
            const current = idx === currentStepIdx;
            return (
              <li key={s} className="relative">
                <div className="flex items-center gap-2 sm:flex-col sm:items-start">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] tabular-nums",
                      reached
                        ? "border-lime bg-lime text-bg"
                        : "border-border bg-surface-2 text-muted-2",
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      current
                        ? "text-lime"
                        : reached
                          ? "text-foreground"
                          : "text-muted-2",
                    )}
                  >
                    {PROJECT_STATUS_LABEL[s]}
                  </span>
                </div>
                {idx < ALL_STATUSES.length - 1 && (
                  <span
                    className={cn(
                      "absolute left-6 top-3 hidden h-px w-full -translate-y-1/2 sm:block",
                      reached ? "bg-lime/50" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
        {project.shippedAt && (
          <p className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-lime">
            <Rocket className="h-3 w-3" />
            Livré le {formatDate(project.shippedAt)}
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main: deliverables + updates */}
        <div className="space-y-6 lg:col-span-2">
          {/* Deliverables */}
          <section className="rounded-2xl border border-border bg-surface">
            <header className="border-b border-border px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              Livrables
            </header>
            {project.deliverables.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Pas encore de livrable. On les pousse au fur et à mesure.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {project.deliverables.map((d) => {
                  const Icon = KIND_ICON[d.kind];
                  return (
                    <li key={d.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-lime">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{d.title}</p>
                          {d.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {d.description}
                            </p>
                          )}
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-lime"
                            >
                              {d.url} <ArrowUpRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                          {timeAgo(d.createdAt)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Updates (visible notes) */}
          <section className="rounded-2xl border border-border bg-surface">
            <header className="border-b border-border px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              Updates
            </header>
            {project.notes.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Pas encore d&apos;update. On poste régulièrement pendant le build.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {project.notes.map((n) => (
                  <li key={n.id} className="px-6 py-4">
                    <Markdown source={n.body} />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      Hulabe · {timeAgo(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-border bg-surface">
            <header className="border-b border-border px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              Historique
            </header>
            {project.activities.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Rien à montrer pour l&apos;instant.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {project.activities.map((a) => (
                  <li key={a.id} className="px-6 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-lime">
                      {a.kind.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{a.summary}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {formatDateTime(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar: support + project meta */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-lime" />
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                Support
              </h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {inSupport
                ? `Tu as une fenêtre de support incluse jusqu'au ${formatDate(project.supportEndsAt)}. Tickets illimités sur cette période.`
                : "La fenêtre support 14 jours incluse est expirée. Tu peux quand même ouvrir un ticket — on revient vers toi avec un devis si c'est hors-périmètre."}
            </p>
            <form action={openSupportRequest} className="mt-4 space-y-3">
              <input type="hidden" name="projectId" value={project.id} />
              <textarea
                name="body"
                rows={4}
                required
                placeholder="Décris ce qu'il te faut. Inclus une URL et capture d'écran si utile."
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="sm" className="w-full">
                Envoyer
              </Button>
            </form>

            {project.supportRequests.length > 0 && (
              <ul className="mt-6 space-y-2">
                {project.supportRequests.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    className="rounded-md border border-border bg-surface-2 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          r.status === "OPEN"
                            ? "border-lime/30 bg-lime/10 text-lime"
                            : r.status === "IN_PROGRESS"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                              : "border-border bg-surface text-muted-foreground",
                        )}
                      >
                        {r.status}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-2">
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-foreground">{r.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Détails
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Démarré</dt>
                <dd className="font-mono">{formatDate(project.startedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Livré</dt>
                <dd className="font-mono">{formatDate(project.shippedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Contact</dt>
                <dd>
                  <a
                    href="mailto:support@hulabe.com"
                    className="inline-flex items-center gap-1 font-mono text-xs hover:text-lime"
                  >
                    support@hulabe.com <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
