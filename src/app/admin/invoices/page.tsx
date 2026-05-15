import { getLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getFormat } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  await requireAdmin();
  const locale = await getLocale();
  const t = await getTranslations("admin.invoices");
  const { formatDate, formatEUR } = getFormat(locale);

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <>
      <PageHeader kicker={t("kicker")} title={t("title")} subtitle={t("subtitle")} />

      <div className="px-4 py-6 sm:px-6 lg:px-10">
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <Receipt className="mx-auto h-6 w-6 text-muted-2" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2/40 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="px-4 py-3 text-left">{t("columns.number")}</th>
                  <th className="px-4 py-3 text-left">{t("columns.status")}</th>
                  <th className="px-4 py-3 text-left">{t("columns.project")}</th>
                  <th className="px-4 py-3 text-right">{t("columns.amount")}</th>
                  <th className="px-4 py-3 text-right">{t("columns.issued")}</th>
                  <th className="px-4 py-3 text-right">{t("columns.paid")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono text-sm">{inv.number}</td>
                    <td className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {inv.status}
                    </td>
                    <td className="px-4 py-3 text-sm">{inv.project.name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatEUR(inv.amountCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {formatDate(inv.issuedAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {formatDate(inv.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
