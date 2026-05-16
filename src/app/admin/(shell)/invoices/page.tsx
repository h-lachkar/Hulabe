import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus, Receipt } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { prisma } from "@/lib/prisma";
import { getFormat } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  DRAFT: "border-border bg-surface-2 text-muted-foreground",
  SENT: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  PAID: "border-lime/30 bg-lime/10 text-lime",
  OVERDUE: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  CANCELLED: "border-border bg-surface-2 text-muted-foreground",
};

export default async function InvoicesPage() {
  await requireAdmin();
  const locale = await getLocale();
  const t = await getTranslations("admin.invoices");
  const { formatDate, formatEUR } = getFormat(locale);

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Link
            href="/admin/invoices/new"
            className="inline-flex items-center gap-2 rounded-md bg-lime px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-lime-dark"
          >
            <Plus className="h-4 w-4" />
            {t("newInvoice")}
          </Link>
        }
      />

      <div className="px-4 py-6 sm:px-6 lg:px-10">
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <Receipt className="mx-auto h-6 w-6 text-muted-2" />
            <p className="mt-3 text-sm text-muted-foreground">{t("empty")}</p>
            <Link
              href="/admin/invoices/new"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-lime px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-lime-dark"
            >
              <Plus className="h-4 w-4" />
              {t("newInvoice")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-surface-2/40 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="px-4 py-3 text-left">{t("columns.number")}</th>
                  <th className="px-4 py-3 text-left">{t("columns.status")}</th>
                  <th className="px-4 py-3 text-left">{t("columns.project")}</th>
                  <th className="px-4 py-3 text-right">{t("columns.amount")}</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">
                    {t("columns.issued")}
                  </th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">
                    {t("columns.paid")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-mono text-sm font-medium text-foreground hover:text-lime"
                      >
                        #{inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                          STATUS_COLOR[inv.status],
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{inv.project.name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatEUR(inv.amountCents)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-xs sm:table-cell">
                      {formatDate(inv.issuedAt)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-xs md:table-cell">
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
