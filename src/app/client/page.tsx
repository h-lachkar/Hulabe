import Link from "next/link";
import { ArrowRight, Folders, Sparkles } from "lucide-react";
import { getClientProjects, requireClient, isInSupportWindow } from "@/lib/client/auth";
import {
  PROJECT_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  SERVICE_LABEL,
  formatDate,
  timeAgo,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientHome() {
  const user = await requireClient();
  const projects = await getClientProjects(user.email!);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-lime" />
            PROJETS
          </p>
          <h1 className="display text-3xl sm:text-4xl">
            Salut<span className="text-lime">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {projects.length === 0
              ? "Pas encore de projet visible côté portail."
              : projects.length === 1
                ? "Voici ton projet en cours."
                : `Voici tes ${projects.length} projets.`}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-muted-2" />
          <p className="mt-3 text-sm text-muted-foreground">
            Si tu es en attente d&apos;un brief ou d&apos;un devis, on revient vers toi
            sous 24h ouvrées. Tu peux aussi écrire à support@hulabe.com.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const inSupport = isInSupportWindow(p.supportEndsAt);
            return (
              <li key={p.id}>
                <Link
                  href={`/client/projects/${p.id}`}
                  className="group block rounded-xl border border-border bg-surface p-6 transition-colors hover:border-lime/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {p.serviceType ? SERVICE_LABEL[p.serviceType] : "Projet"}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-semibold text-foreground">
                        {p.name}
                      </h2>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-2 transition-all group-hover:translate-x-0.5 group-hover:text-lime" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                        PROJECT_STATUS_COLOR[p.status],
                      )}
                    >
                      {PROJECT_STATUS_LABEL[p.status]}
                    </span>
                    {inSupport && (
                      <span className="inline-flex rounded border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
                        Support actif · jusqu&apos;au {formatDate(p.supportEndsAt)}
                      </span>
                    )}
                  </div>

                  <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="font-mono uppercase tracking-wider text-muted-2">
                        Démarré
                      </dt>
                      <dd className="mt-1 font-mono text-foreground">
                        {formatDate(p.startedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono uppercase tracking-wider text-muted-2">
                        {p.shippedAt ? "Livré" : "Mis à jour"}
                      </dt>
                      <dd className="mt-1 font-mono text-foreground">
                        {p.shippedAt ? formatDate(p.shippedAt) : timeAgo(p.updatedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono uppercase tracking-wider text-muted-2">
                        Livrables
                      </dt>
                      <dd className="mt-1 font-mono text-foreground">
                        {p._count.deliverables}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono uppercase tracking-wider text-muted-2">
                        Tickets
                      </dt>
                      <dd className="mt-1 font-mono text-foreground">
                        {p._count.supportRequests}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {projects.length > 0 && (
        <p className="mt-12 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Folders className="h-3 w-3" />
          {projects.length} projet{projects.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
