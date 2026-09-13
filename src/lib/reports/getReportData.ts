import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getPeriodRange,
  getChartBuckets,
  getCustomChartBuckets,
  getCustomRange,
  getPreviousPeriodRange,
  isValidDateString,
  type ReportPeriod,
} from "@/lib/reports/period";

export type ReportData = {
  period: ReportPeriod;
  start: Date;
  end: Date;
  isCustomRange: boolean;
  revenueCents: number;
  orderCount: number;
  averageTicketCents: number;
  cancelledCount: number;
  newCustomersCount: number;
  menuViewsCount: number;
  conversionRate: number | null;
  previousRevenueCents: number;
  revenueChangePct: number | null;
  topItems: { name: string; quantity: number; revenueCents: number }[];
  chartPoints: { label: string; revenueCents: number; ordersCount: number }[];
};

export type ReportRangeParams = { period: ReportPeriod; from?: string; to?: string };

export async function getReportData(storeId: string, params: ReportRangeParams): Promise<ReportData> {
  const isCustomRange = isValidDateString(params.from) && isValidDateString(params.to);
  const { start, end } = isCustomRange
    ? getCustomRange(params.from!, params.to!)
    : getPeriodRange(params.period);
  const dateFilter = { storeId, createdAt: { gte: start, lt: end } };

  const previousRange = getPreviousPeriodRange(start, end);
  const previousDateFilter = { storeId, createdAt: { gte: previousRange.start, lt: previousRange.end } };

  const [orders, cancelledCount, items, newCustomersCount, menuViewsCount, previousOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: { ...dateFilter, status: { not: "CANCELADO" } },
        select: { createdAt: true, totalCents: true },
      }),
      prisma.order.count({ where: { ...dateFilter, status: "CANCELADO" } }),
      prisma.orderItem.findMany({
        where: { order: { ...dateFilter, status: { not: "CANCELADO" } } },
        select: {
          productId: true,
          productNameSnapshot: true,
          unitPriceCentsSnapshot: true,
          optionsTotalCentsSnapshot: true,
          quantity: true,
        },
      }),
      prisma.customer.count({ where: dateFilter }),
      prisma.menuView.count({ where: dateFilter }),
      prisma.order.findMany({
        where: { ...previousDateFilter, status: { not: "CANCELADO" } },
        select: { totalCents: true },
      }),
    ]);

  const revenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0);
  const orderCount = orders.length;
  const averageTicketCents = orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;
  const conversionRate = menuViewsCount > 0 ? orderCount / menuViewsCount : null;

  const previousRevenueCents = previousOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const revenueChangePct =
    previousRevenueCents > 0 ? (revenueCents - previousRevenueCents) / previousRevenueCents : null;

  const itemsByKey = new Map<string, { name: string; quantity: number; revenueCents: number }>();
  for (const item of items) {
    const key = item.productId ?? item.productNameSnapshot;
    const lineRevenue = (item.unitPriceCentsSnapshot + item.optionsTotalCentsSnapshot) * item.quantity;
    const existing = itemsByKey.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenueCents += lineRevenue;
    } else {
      itemsByKey.set(key, {
        name: item.productNameSnapshot,
        quantity: item.quantity,
        revenueCents: lineRevenue,
      });
    }
  }
  const topItems = Array.from(itemsByKey.values()).sort((a, b) => b.quantity - a.quantity);

  const buckets = isCustomRange
    ? getCustomChartBuckets(start, end)
    : getChartBuckets(params.period, start, end);
  const chartPoints = buckets.map((bucket) => {
    const bucketOrders = orders.filter(
      (order) => order.createdAt >= bucket.start && order.createdAt < bucket.end
    );
    return {
      label: bucket.label,
      revenueCents: bucketOrders.reduce((sum, order) => sum + order.totalCents, 0),
      ordersCount: bucketOrders.length,
    };
  });

  return {
    period: params.period,
    start,
    end,
    isCustomRange,
    revenueCents,
    orderCount,
    averageTicketCents,
    cancelledCount,
    newCustomersCount,
    menuViewsCount,
    conversionRate,
    previousRevenueCents,
    revenueChangePct,
    topItems,
    chartPoints,
  };
}
