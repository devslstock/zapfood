import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSession } from "@/lib/auth/guards";
import { formatCents } from "@/lib/money";
import {
  getPlatformReportData,
  isPlatformPeriod,
  PLATFORM_PERIOD_LABELS,
  type PlatformPeriod,
} from "@/lib/platformReports";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  await requirePlatformSession();

  const rawPeriod = request.nextUrl.searchParams.get("period") ?? undefined;
  const period: PlatformPeriod = isPlatformPeriod(rawPeriod) ? rawPeriod : "30d";
  const report = await getPlatformReportData(period);

  const rows: string[][] = [
    ["Relatório da plataforma ZaapFood", PLATFORM_PERIOD_LABELS[period]],
    [],
    ["Receita mensal recorrente (MRR) atual", formatCents(report.currentMrrCents)],
    ["Novas assinaturas no período", String(report.totalNewSubscriptions)],
    ["Cancelamentos no período", String(report.totalCancellations)],
    [],
    ["Data/mês", "MRR no fim do período", "Novas assinaturas", "Cancelamentos"],
    ...report.points.map((point) => [
      point.label,
      formatCents(point.revenueCents),
      String(point.newSubscriptions),
      String(point.cancellations),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-plataforma-${period}.csv"`,
    },
  });
}
