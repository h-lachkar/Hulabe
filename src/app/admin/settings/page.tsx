import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { admin } = await requireAdmin();
  const isOwner = admin.role === "OWNER";

  const teamSnapshot = isOwner
    ? await prisma.adminUser.findMany({
        select: { id: true, email: true, role: true, isActive: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      })
    : null;

  return (
    <>
      <PageHeader kicker="SETTINGS" title="Configuration." />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Mon compte
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {admin.name && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nom
                </dt>
                <dd className="mt-1 text-foreground">{admin.name}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-foreground">{admin.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Rôle
              </dt>
              <dd className="mt-1 font-mono text-xs text-foreground">{admin.role}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Compte créé
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {formatDate(admin.createdAt)}
              </dd>
            </div>
          </dl>
        </section>

        {isOwner && teamSnapshot && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                Équipe admin
              </h2>
              <Link
                href="/admin/team"
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-lime"
              >
                Gérer <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {teamSnapshot.length} compte{teamSnapshot.length > 1 ? "s" : ""}. Tu peux
              inviter, désactiver ou supprimer des admins sur la page Team.
            </p>
            <ul className="mt-4 space-y-1.5">
              {teamSnapshot.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
                >
                  <span className="font-mono">{a.email}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      a.role === "OWNER"
                        ? "border-lime/30 bg-lime/10 text-lime"
                        : a.role === "ADMIN"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                          : "border-border bg-surface text-muted-foreground"
                    } ${!a.isActive ? "opacity-50" : ""}`}
                  >
                    {a.role.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Intégrations
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Integration
              name="Supabase"
              ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
              hint="Auth + DB"
            />
            <Integration
              name="Supabase service role"
              ok={!!process.env.SUPABASE_SERVICE_ROLE_KEY}
              hint="Magic-link client portal + invitations admin"
            />
            <Integration
              name="Resend"
              ok={!!process.env.RESEND_API_KEY}
              hint="Emails transactionnels"
            />
            <Integration
              name="PostHog"
              ok={!!process.env.NEXT_PUBLIC_POSTHOG_KEY}
              hint="Analytics + session replay"
            />
            <Integration
              name="Anthropic (Claude)"
              ok={!!process.env.ANTHROPIC_API_KEY}
              hint={`AI lead scoring · ${process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"}`}
            />
          </ul>
        </section>

        {!isOwner && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              <Users className="mr-2 inline h-3.5 w-3.5" />
              Équipe
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Seul un <span className="font-mono">OWNER</span> peut gérer l&apos;équipe
              admin. Demande à un owner de t&apos;ajouter ou de changer ton rôle.
            </p>
          </section>
        )}
      </div>
    </>
  );
}

function Integration({
  name,
  ok,
  hint,
}: {
  name: string;
  ok: boolean;
  hint: string;
}) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
      <div>
        <p className="font-mono text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span
        className={
          ok
            ? "rounded border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime"
            : "rounded border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        }
      >
        {ok ? "● connected" : "○ not set"}
      </span>
    </li>
  );
}
