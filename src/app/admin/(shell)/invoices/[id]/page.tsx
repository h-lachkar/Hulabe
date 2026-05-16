import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Download, FileText, Send, CheckCircle2, XCircle } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { getFormat } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import {
  deleteInvoice,
  setInvoiceStatus,
  updateInvoice,
} from "@/lib/admin/invoice-actions";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { DangerZone } from "@/components/admin/danger-zone";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  DRAFT: "border-border bg-surface-2 text-muted-foreground",
  SENT: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  PAID: "border-lime/30 bg-lime/10 text-lime",
  OVERDUE: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  CANCELLED: "border-border bg-surface-2 text-muted-foreground",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { admin } = await requireAdmin();
  const isOwner = admin.role === "OWNER";
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("admin.invoices");
  const { formatDate, formatEUR, timeAgo } = getFormat(locale);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lines: true, project: { include: { lead: true } } },
  });
  if (!invoice) notFound();

  const initial = {
    invoiceId: invoice.id,
    projectId: invoice.projectId,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientAddress: invoice.clientAddress,
    clientVatNumber: invoice.clientVatNumber,
    taxRatePct: invoice.taxRate / 100,
    notes: invoice.notes,
    lines: invoice.lines
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceEuros: l.unitPriceCents / 100,
      })),
  };

  return (
    <>
      <PageHeader
        kicker={`INVOICE / #${invoice.number}`}
        title={`${formatEUR(invoice.amountCents)}`}
        subtitle={t("detail.subtitle", {
          project: invoice.project.name,
          status: invoice.status,
          ago: timeAgo(invoice.updatedAt),
        })}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/invoices"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToList")}
            </Link>
            <a
              href={`/admin/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              {t("detail.downloadPdf")}
            </a>
          </div>
        }
      />

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-10">
        <div className="space-y-6 lg:col-span-2">
          {/* Status + actions */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-xs uppercase tracking-wider",
                  STATUS_COLOR[invoice.status],
                )}
              >
                <FileText className="h-3 w-3" />
                {invoice.status}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {invoice.status === "DRAFT" && (
                  <form action={setInvoiceStatus}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="status" value="SENT" />
                    <Button type="submit" size="sm" variant="secondary">
                      <Send className="h-3.5 w-3.5" />
                      {t("detail.markSent")}
                    </Button>
                  </form>
                )}
                {invoice.status === "SENT" && (
                  <form action={setInvoiceStatus}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="status" value="PAID" />
                    <Button type="submit" size="sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("detail.markPaid")}
                    </Button>
                  </form>
                )}
                {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
                  <form action={setInvoiceStatus}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <input type="hidden" name="status" value="CANCELLED" />
                    <Button type="submit" size="sm" variant="ghost">
                      <XCircle className="h-3.5 w-3.5" />
                      {t("detail.cancel")}
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <KV label={t("columns.issued")} value={formatDate(invoice.issuedAt)} />
              <KV label={t("detail.dueAt")} value={formatDate(invoice.dueAt)} />
              <KV label={t("columns.paid")} value={formatDate(invoice.paidAt)} />
              <KV
                label={t("detail.project")}
                value={
                  <Link href={`/admin/projects/${invoice.project.id}`} className="text-lime hover:underline">
                    {invoice.project.name}
                  </Link>
                }
              />
            </dl>
          </div>

          {/* Edit form */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("detail.editTitle")}
            </h3>
            <InvoiceForm mode="edit" action={updateInvoice} initial={initial} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("detail.preview")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("detail.previewHint")}
            </p>
            <a
              href={`/admin/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-lime px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-lime-dark"
            >
              <Download className="h-4 w-4" />
              {t("detail.openPdf")}
            </a>
          </div>

          {isOwner && (
            <DangerZone
              action={deleteInvoice}
              idField="invoiceId"
              id={invoice.id}
              entityLabel={`#${invoice.number}`}
              isOwner={isOwner}
            />
          )}
        </aside>
      </div>
    </>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
