import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireMutator } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/page-header";
import { createInvoice } from "@/lib/admin/invoice-actions";
import { InvoiceForm } from "@/components/admin/invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  await requireMutator();
  const sp = await searchParams;
  const presetProjectId = sp.projectId;
  const t = await getTranslations("admin.invoices");

  const projects = await prisma.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { lead: { select: { name: true, email: true } } },
  });

  const projectsForPicker = projects.map((p) => ({
    id: p.id,
    name: p.name,
    priceQuotedCents: p.priceQuotedCents,
    leadName: p.lead?.name ?? null,
    leadEmail: p.lead?.email ?? null,
  }));

  const initialProject =
    projectsForPicker.find((p) => p.id === presetProjectId) ?? projectsForPicker[0];

  return (
    <>
      <PageHeader
        kicker={t("kicker")}
        title={t("new.title")}
        subtitle={t("new.subtitle")}
        actions={
          <Link
            href="/admin/invoices"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToList")}
          </Link>
        }
      />
      <div className="px-4 py-6 sm:px-6 lg:px-10">
        <InvoiceForm
          mode="create"
          action={createInvoice}
          projects={projectsForPicker}
          initial={{
            projectId: initialProject?.id ?? "",
            clientName: initialProject?.leadName,
            clientEmail: initialProject?.leadEmail,
            taxRatePct: 20,
            dueDays: 30,
            lines: initialProject?.priceQuotedCents
              ? [
                  {
                    description: initialProject.name,
                    quantity: 1,
                    unitPriceEuros: initialProject.priceQuotedCents / 100,
                  },
                ]
              : [],
          }}
        />
      </div>
    </>
  );
}
