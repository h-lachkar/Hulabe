import { prisma } from "@/lib/prisma";

/**
 * Mint the next invoice number for the given year, e.g. "2026-0042".
 * Uses an atomic upsert+increment via a transaction to avoid race conditions.
 */
export async function nextInvoiceNumber(year = new Date().getUTCFullYear()): Promise<string> {
  const counter = await prisma.invoiceCounter.upsert({
    where: { year },
    create: { year, current: 1 },
    update: { current: { increment: 1 } },
  });
  const padded = String(counter.current).padStart(4, "0");
  return `${year}-${padded}`;
}
