"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvoiceStatus, ActivityKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMutator, requireOwner } from "@/lib/admin/auth";
import { nextInvoiceNumber } from "@/lib/invoice/numbering";

/* ----------------------------- Helpers --------------------------------- */

async function logInvoiceActivity(args: {
  kind: ActivityKind;
  summary: string;
  metadata?: Record<string, unknown>;
  authorId: string;
  authorEmail: string;
  projectId: string;
}) {
  await prisma.activity.create({
    data: {
      kind: args.kind,
      summary: args.summary,
      metadata: args.metadata as object | undefined,
      authorId: args.authorId,
      authorEmail: args.authorEmail,
      projectId: args.projectId,
    },
  });
}

function parseLines(formData: FormData) {
  // Lines are passed as `lines[i][description]`, `lines[i][quantity]`, `lines[i][unitPriceCents]`
  const lines: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    position: number;
  }[] = [];
  let i = 0;
  while (true) {
    const desc = formData.get(`lines[${i}][description]`);
    if (desc === null) break;
    const description = String(desc).trim();
    if (description.length === 0) {
      i++;
      continue;
    }
    const quantity = Number(formData.get(`lines[${i}][quantity]`) ?? 1) || 1;
    // Accept either "unitPriceCents" (cents) or "unitPrice" (decimal euros) in form
    const rawCents = formData.get(`lines[${i}][unitPriceCents]`);
    const rawEuros = formData.get(`lines[${i}][unitPrice]`);
    const unitPriceCents = rawCents != null
      ? Math.round(Number(rawCents))
      : rawEuros != null
        ? Math.round(Number(String(rawEuros).replace(",", ".")) * 100)
        : 0;
    lines.push({
      description,
      quantity,
      unitPriceCents,
      position: i,
    });
    i++;
  }
  return lines;
}

function computeTotals(
  lines: { quantity: number; unitPriceCents: number }[],
  taxRate: number,
) {
  const subtotal = lines.reduce(
    (sum, l) => sum + Math.round(l.quantity * l.unitPriceCents),
    0,
  );
  const tax = Math.round((subtotal * taxRate) / 10000);
  return { subtotal, tax, total: subtotal + tax };
}

/* ---------------------------- Create ----------------------------------- */

export type CreateInvoiceResult = {
  ok: boolean;
  invoiceId?: string;
  error?: string;
};

/**
 * Create a draft invoice. Required: projectId. The rest auto-fills from the
 * project's lead, but every field can be overridden via the form.
 */
export async function createInvoice(formData: FormData): Promise<void> {
  const { user } = await requireMutator();
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) throw new Error("projectId is required");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { lead: true },
  });
  if (!project) throw new Error("Project not found");

  const number = await nextInvoiceNumber();

  const lines = parseLines(formData);
  // If no lines were submitted, seed a single line from the project's quote price.
  const seededLines =
    lines.length === 0 && project.priceQuotedCents
      ? [
          {
            description: project.name,
            quantity: 1,
            unitPriceCents: project.priceQuotedCents,
            position: 0,
          },
        ]
      : lines;

  const taxRateRaw = Number(formData.get("taxRate") ?? 0);
  const taxRate = Math.max(0, Math.min(10000, Math.round(taxRateRaw * 100)));
  const { subtotal, tax, total } = computeTotals(seededLines, taxRate);

  const clientName =
    String(formData.get("clientName") ?? "").trim() ||
    project.lead?.name ||
    project.lead?.email ||
    null;
  const clientEmail =
    String(formData.get("clientEmail") ?? "").trim() ||
    project.lead?.email ||
    null;
  const clientAddress =
    String(formData.get("clientAddress") ?? "").trim() || null;
  const clientVatNumber =
    String(formData.get("clientVatNumber") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dueDaysRaw = formData.get("dueDays");
  const dueDays = dueDaysRaw ? Number(dueDaysRaw) : 30;
  const dueAt = dueDays ? new Date(Date.now() + dueDays * 24 * 3600 * 1000) : null;

  const invoice = await prisma.invoice.create({
    data: {
      projectId,
      number,
      status: InvoiceStatus.DRAFT,
      subtotalCents: subtotal,
      taxRate,
      taxCents: tax,
      amountCents: total,
      clientName,
      clientEmail,
      clientAddress,
      clientVatNumber,
      notes,
      dueAt,
      lines: {
        create: seededLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          totalCents: Math.round(l.quantity * l.unitPriceCents),
          position: l.position,
        })),
      },
    },
  });

  await logInvoiceActivity({
    kind: ActivityKind.INVOICE_CREATED,
    summary: `Created invoice ${invoice.number} (${(total / 100).toFixed(2)} EUR)`,
    metadata: { invoiceId: invoice.id, amountCents: total },
    projectId,
    authorId: user.id,
    authorEmail: user.email,
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/invoices/${invoice.id}`);
}

/* ---------------------------- Update ----------------------------------- */

export async function updateInvoice(formData: FormData): Promise<void> {
  const { user } = await requireMutator();
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  if (!invoiceId) throw new Error("invoiceId is required");

  const current = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!current) throw new Error("Invoice not found");

  const lines = parseLines(formData);
  const taxRateRaw = Number(formData.get("taxRate") ?? current.taxRate / 100);
  const taxRate = Math.max(0, Math.min(10000, Math.round(taxRateRaw * 100)));
  const { subtotal, tax, total } = computeTotals(lines, taxRate);

  // Replace all lines (simple/atomic). Cascade delete + recreate inside a tx.
  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId } });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotalCents: subtotal,
        taxRate,
        taxCents: tax,
        amountCents: total,
        clientName: (String(formData.get("clientName") ?? "").trim() || null),
        clientEmail: (String(formData.get("clientEmail") ?? "").trim() || null),
        clientAddress:
          String(formData.get("clientAddress") ?? "").trim() || null,
        clientVatNumber:
          String(formData.get("clientVatNumber") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        lines: {
          create: lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            totalCents: Math.round(l.quantity * l.unitPriceCents),
            position: l.position,
          })),
        },
      },
    });
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/admin/projects/${current.projectId}`);
}

/* ---------------------------- Status ----------------------------------- */

export async function setInvoiceStatus(formData: FormData): Promise<void> {
  const { user } = await requireMutator();
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const next = String(formData.get("status") ?? "") as InvoiceStatus;
  if (!invoiceId || !next) return;

  const data: { status: InvoiceStatus; issuedAt?: Date; paidAt?: Date | null } = {
    status: next,
  };
  if (next === InvoiceStatus.SENT) data.issuedAt = new Date();
  if (next === InvoiceStatus.PAID) data.paidAt = new Date();
  if (next === InvoiceStatus.DRAFT) data.paidAt = null;

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data,
  });

  await logInvoiceActivity({
    kind: ActivityKind.INVOICE_STATUS_CHANGED,
    summary: `Invoice ${updated.number} → ${next}`,
    metadata: { status: next },
    projectId: updated.projectId,
    authorId: user.id,
    authorEmail: user.email,
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/projects/${updated.projectId}`);
}

/* ---------------------------- Delete ----------------------------------- */

export async function deleteInvoice(formData: FormData): Promise<void> {
  await requireOwner();
  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "");
  if (!invoiceId || confirm !== "DELETE") {
    throw new Error("Type DELETE to confirm.");
  }
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/projects/${invoice.projectId}`);
  redirect("/admin/invoices");
}
