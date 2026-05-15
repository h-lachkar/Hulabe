import { getTranslations } from "next-intl/server";
import { requireClient } from "@/lib/client/auth";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const user = await requireClient();
  const t = await getTranslations("clientPortal.settings");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-1 w-1 rounded-full bg-lime" />
        {t("kicker")}
      </p>
      <h1 className="display text-3xl sm:text-4xl">{t("title")}</h1>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
          {t("identityTitle")}
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("email")}
            </dt>
            <dd className="mt-1 text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("userId")}
            </dt>
            <dd className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-muted-foreground">
          {t("footnotePrefix")}
          <a className="text-lime hover:underline" href="mailto:support@hulabe.com">
            support@hulabe.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
