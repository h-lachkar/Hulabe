import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/client/auth";
import { cn } from "@/lib/utils";
import { getFormat } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function ClientSupportPage() {
  const user = await requireClient();
  const locale = await getLocale();
  const t = await getTranslations("clientPortal.support");
  const { timeAgo } = getFormat(locale);

  const requests = await prisma.supportRequest.findMany({
    where: { project: { lead: { email: user.email!.toLowerCase() } } },
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-1 w-1 rounded-full bg-lime" />
        {t("kicker")}
      </p>
      <h1 className="display text-3xl sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

      <section className="mt-10 rounded-2xl border border-border bg-surface">
        {requests.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <LifeBuoy className="mx-auto h-6 w-6 text-muted-2" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/client/projects/${r.projectId}`}
                  className="flex items-start gap-3 px-6 py-4 hover:bg-surface-2/40"
                >
                  <span
                    className={cn(
                      "mt-1 inline-flex shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                      r.status === "OPEN"
                        ? "border-lime/30 bg-lime/10 text-lime"
                        : r.status === "IN_PROGRESS"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-border bg-surface-2 text-muted-foreground",
                    )}
                  >
                    {r.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-2">{r.body}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-2">
                      {r.project.name} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
