import { prisma } from "@/lib/prisma";
import { LeadStatus, ProjectStatus, InvoiceStatus } from "@prisma/client";

/**
 * Returns the aggregate KPIs displayed on the admin dashboard.
 * All queries are parallelized; expect ~1 round-trip total to Supabase.
 *
 * MTD = month-to-date. PTD = previous month-to-date (for delta comparison).
 */
export async function getDashboardKpis() {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfPrevMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const ago30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const ago60 = new Date(Date.now() - 60 * 24 * 3600 * 1000);

  const [
    leadsThisMonth,
    leadsPrevMonth,
    leadsWonThisMonth,
    leadsLostThisMonth,
    projectsActive,
    projectsByStatus,
    revenuePaidMtd,
    revenuePaidPrevMtd,
    revenueOutstanding,
    revenueOverdue,
    clientsActive,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.lead.count({
      where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
    }),
    prisma.lead.count({
      where: { status: LeadStatus.WON, updatedAt: { gte: startOfMonth } },
    }),
    prisma.lead.count({
      where: { status: LeadStatus.LOST, updatedAt: { gte: startOfMonth } },
    }),
    prisma.project.count({
      where: { status: { notIn: [ProjectStatus.ARCHIVED, ProjectStatus.SHIPPED] } },
    }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      _sum: { amountCents: true },
      where: { status: InvoiceStatus.PAID, paidAt: { gte: startOfMonth } },
    }),
    prisma.invoice.aggregate({
      _sum: { amountCents: true },
      where: {
        status: InvoiceStatus.PAID,
        paidAt: { gte: startOfPrevMonth, lt: startOfMonth },
      },
    }),
    prisma.invoice.aggregate({
      _sum: { amountCents: true },
      where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } },
    }),
    prisma.invoice.aggregate({
      _sum: { amountCents: true },
      where: { status: InvoiceStatus.OVERDUE },
    }),
    prisma.clientUser.count({ where: { isActive: true } }),
  ]);

  // Velocity: avg days from project SIGNED → SHIPPED (last 30 days)
  const shipped = await prisma.project.findMany({
    where: {
      shippedAt: { gte: ago30, not: null },
      startedAt: { not: null },
    },
    select: { startedAt: true, shippedAt: true },
  });
  const avgVelocityDays =
    shipped.length === 0
      ? null
      : Math.round(
          shipped.reduce((sum, p) => {
            const days =
              (p.shippedAt!.getTime() - p.startedAt!.getTime()) /
              (1000 * 3600 * 24);
            return sum + days;
          }, 0) / shipped.length,
        );

  const projectsByStatusMap = projectsByStatus.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as Record<ProjectStatus, number>,
  );

  const conversionRate =
    leadsThisMonth === 0 ? null : Math.round((leadsWonThisMonth / leadsThisMonth) * 100);
  const prevConversionRate =
    leadsPrevMonth === 0
      ? null
      : Math.round(
          ((leadsWonThisMonth || 0) / leadsPrevMonth) * 100,
        );

  return {
    leadsMtd: leadsThisMonth,
    leadsPrevMtd: leadsPrevMonth,
    leadsWonMtd: leadsWonThisMonth,
    leadsLostMtd: leadsLostThisMonth,
    conversionRate,
    prevConversionRate,
    projectsActive,
    projectsByStatus: projectsByStatusMap,
    revenuePaidMtdCents: revenuePaidMtd._sum.amountCents ?? 0,
    revenuePaidPrevMtdCents: revenuePaidPrevMtd._sum.amountCents ?? 0,
    revenueOutstandingCents: revenueOutstanding._sum.amountCents ?? 0,
    revenueOverdueCents: revenueOverdue._sum.amountCents ?? 0,
    avgVelocityDays,
    clientsActive,
  };
}

export type DashboardKpis = Awaited<ReturnType<typeof getDashboardKpis>>;
