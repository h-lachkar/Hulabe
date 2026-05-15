import Link from "next/link";
import { LifeBuoy, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { prisma } from "@/lib/prisma";
import { formatDate, timeAgo } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  await requireAdmin();
  const requests = await prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true, supportEndsAt: true } } },
  });

  const projectsInSupport = await prisma.project.findMany({
    where: {
      shippedAt: { not: null },
      supportEndsAt: { gte: new Date() },
    },
    orderBy: { supportEndsAt: "asc" },
  });

  return (
    <>
      <PageHeader
        kicker="SUPPORT"
        title="Demandes & fenêtre 14j."
        subtitle="Tickets support clients + projets actuellement dans la fenêtre support 14 jours."
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        {/* Active support windows */}
        <section className="rounded-xl border border-border bg-surface">
          <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Projets en fenêtre support
          </header>
          {projectsInSupport.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Aucun projet actuellement dans la fenêtre support 14 jours.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {projectsInSupport.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-2/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Shippé {formatDate(p.shippedAt)} · expire {formatDate(p.supportEndsAt)}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tickets */}
        <section className="rounded-xl border border-border bg-surface">
          <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Tickets
          </header>
          {requests.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <LifeBuoy className="mx-auto h-6 w-6 text-muted-2" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun ticket. La table SupportRequest est déjà câblée côté DB et sera
                alimentée par le client portal une fois lancé.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground line-clamp-2">{r.body}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                        {r.project.name} · {r.createdByEmail ?? "client"} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                        r.status === "OPEN"
                          ? "border-lime/30 bg-lime/10 text-lime"
                          : r.status === "IN_PROGRESS"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-border bg-surface-2 text-muted-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
