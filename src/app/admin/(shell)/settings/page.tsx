import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Users, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { LocalePicker } from "@/components/locale-picker";
import { getFormat } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { admin } = await requireAdmin();
  const isOwner = admin.role === "OWNER";
  const locale = await getLocale();
  const t = await getTranslations("admin.settings");
  const { formatDate } = getFormat(locale);

  const teamSnapshot = isOwner
    ? await prisma.adminUser.findMany({
        select: { id: true, email: true, role: true, isActive: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      })
    : null;

  return (
    <>
      <PageHeader kicker={t("kicker")} title={t("title")} />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            {t("myAccount")}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {admin.name && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("fields.name")}
                </dt>
                <dd className="mt-1 text-foreground">{admin.name}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("fields.email")}
              </dt>
              <dd className="mt-1 text-foreground">{admin.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("fields.role")}
              </dt>
              <dd className="mt-1 font-mono text-xs text-foreground">{admin.role}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("fields.createdAt")}
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {formatDate(admin.createdAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Locale picker */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <LocalePicker />
        </section>

        {isOwner && teamSnapshot && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                {t("teamTitle")}
              </h2>
              <Link
                href="/admin/team"
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-lime"
              >
                {t("manage")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {teamSnapshot.length > 1
                ? t("teamCountMany", { count: teamSnapshot.length })
                : t("teamCountOne", { count: teamSnapshot.length })}
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
            {t("integrationsTitle")}
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Integration
              name="Supabase"
              ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
              hint={t("integrationsHints.supabase")}
              connectedLabel={t("connected")}
              notSetLabel={t("notSet")}
            />
            <Integration
              name="Supabase service role"
              ok={!!process.env.SUPABASE_SERVICE_ROLE_KEY}
              hint={t("integrationsHints.supabaseService")}
              connectedLabel={t("connected")}
              notSetLabel={t("notSet")}
            />
            <Integration
              name="Resend"
              ok={!!process.env.RESEND_API_KEY}
              hint={t("integrationsHints.resend")}
              connectedLabel={t("connected")}
              notSetLabel={t("notSet")}
            />
            <Integration
              name="PostHog"
              ok={!!process.env.NEXT_PUBLIC_POSTHOG_KEY}
              hint={t("integrationsHints.posthog")}
              connectedLabel={t("connected")}
              notSetLabel={t("notSet")}
            />
            <Integration
              name="Anthropic (Claude)"
              ok={!!process.env.ANTHROPIC_API_KEY}
              hint={t("integrationsHints.anthropic", {
                model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
              })}
              connectedLabel={t("connected")}
              notSetLabel={t("notSet")}
            />
          </ul>
        </section>

        {!isOwner && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              <Users className="mr-2 inline h-3.5 w-3.5" />
              {t("teamSection")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("ownerOnlyNote", { role: "OWNER" })}
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
  connectedLabel,
  notSetLabel,
}: {
  name: string;
  ok: boolean;
  hint: string;
  connectedLabel: string;
  notSetLabel: string;
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
        {ok ? connectedLabel : notSetLabel}
      </span>
    </li>
  );
}
