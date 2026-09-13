import { NextRequest, NextResponse } from "next/server";
import { requireSession, requirePermission } from "@/lib/auth/guards";
import { isReportPeriod, isValidDateString, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/reports/period";
import { getReportData } from "@/lib/reports/getReportData";
import { formatCents } from "@/lib/money";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const session = await requireSession();
  requirePermission(session, "reports");

  const rawPeriod = request.nextUrl.searchParams.get("period") ?? undefined;
  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const period: ReportPeriod = isReportPeriod(rawPeriod) ? rawPeriod : "dia";
  const report = await getReportData(session.storeId, { period, from, to });
  const periodLabel =
    isValidDateString(from) && isValidDateString(to) ? `${from} a ${to}` : REPORT_PERIOD_LABELS[period];

  const rows: string[][] = [
    ["Relatório de vendas", periodLabel],
    [],
    ["Faturamento", formatCents(report.revenueCents)],
    ["Pedidos", String(report.orderCount)],
    ["Ticket médio", formatCents(report.averageTicketCents)],
    ["Cancelados", String(report.cancelledCount)],
    ["Novos clientes", String(report.newCustomersCount)],
    ["Visitas ao cardápio", String(report.menuViewsCount)],
    [
      "Taxa de conversão",
      report.conversionRate === null ? "-" : `${(report.conversionRate * 100).toFixed(1)}%`,
    ],
    [],
    ["Produto", "Quantidade vendida", "Faturamento"],
    ...report.topItems.map((item) => [item.name, String(item.quantity), formatCents(item.revenueCents)]),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const bom = "﻿"; // Excel abre acentuação corretamente com BOM UTF-8.

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${period}.csv"`,
    },
  });
}
