import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAdmin();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <PageHeader kicker="SETTINGS" title="Configuration." />
      <div className="space-y-6 px-6 py-6 sm:px-10">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Compte
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                User ID
              </dt>
              <dd className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Admins autorisés
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configurés via la variable d&apos;environnement{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
              ADMIN_EMAILS
            </code>{" "}
            (séparés par des virgules).
          </p>
          {adminEmails.length === 0 ? (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              ⚠ Aucun admin configuré. Ajoute ton email dans{" "}
              <code>ADMIN_EMAILS</code>.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {adminEmails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
                >
                  <span className="font-mono">{email}</span>
                  {email.toLowerCase() === user.email?.toLowerCase() && (
                    <span className="rounded border border-lime/30 bg-lime/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
                      You
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

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
              name="Resend"
              ok={!!process.env.RESEND_API_KEY}
              hint="Emails transactionnels"
            />
            <Integration
              name="PostHog"
              ok={!!process.env.NEXT_PUBLIC_POSTHOG_KEY}
              hint="Analytics + session replay"
            />
          </ul>
        </section>
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
