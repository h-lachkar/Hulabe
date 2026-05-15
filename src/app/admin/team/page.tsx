import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { InviteAdminForm } from "@/components/admin/invite-admin-form";
import { AdminTeamRow } from "@/components/admin/admin-team-row";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const ctx = await requireOwner();
  const t = await getTranslations("admin.team");

  const admins = await prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    include: {
      invitedBy: { select: { email: true, name: true } },
    },
  });

  const ownerCount = admins.filter((a) => a.role === "OWNER" && a.isActive).length;
  const subtitle =
    admins.length > 1 || ownerCount > 1
      ? t("subtitleMany", { count: admins.length, owners: ownerCount })
      : t("subtitleOne", { count: admins.length, owners: ownerCount });

  return (
    <>
      <PageHeader kicker={t("kicker")} title={t("title")} subtitle={subtitle} />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            {t("inviteTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.rich("inviteBody", {
              path: () => (
                <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">/admin</code>
              ),
            })}
          </p>
          <div className="mt-5">
            <InviteAdminForm />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <header className="border-b border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            {t("listTitle")}
          </header>
          {admins.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              {t("listEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {admins.map((a) => (
                <AdminTeamRow
                  key={a.id}
                  admin={a}
                  isCurrent={a.id === ctx.admin.id}
                  invitedByLabel={
                    a.invitedBy ? a.invitedBy.name ?? a.invitedBy.email : null
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
