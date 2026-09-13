import Link from "next/link";
import { requireSession, requirePermission } from "@/lib/auth/guards";
import { formatCents } from "@/lib/money";
import { REPORT_PERIODS, REPORT_PERIOD_LABELS, isReportPeriod, isValidDateString, type ReportPeriod } from "@/lib/reports/period";
import { getReportData } from "@/lib/reports/getReportData";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { PrintModalButton } from "@/components/admin/PrintModalButton";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const session = await requireSession();
  requirePermission(session, "reports");
  const { period: rawPeriod, from, to } = await searchParams;
  const period: ReportPeriod = isReportPeriod(rawPeriod) ? rawPeriod : "dia";
  const hasCustomRange = isValidDateString(from) && isValidDateString(to);

  const report = await getReportData(session.storeId, { period, from, to });
  const exportQuery = hasCustomRange
    ? `from=${from}&to=${to}`
    : `period=${period}`;

  const top5 = report.topItems.slice(0, 5);
  const rest = report.topItems.slice(5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Relatório de vendas</h1>
          <p className="mt-1 text-sm text-zinc-500">Faturamento e itens mais vendidos por período.</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/admin/relatorios/export?${exportQuery}&format=csv`}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Exportar CSV
          </a>
          <PrintModalButton
            url={`/print/relatorios?${exportQuery}`}
            label="Exportar PDF"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {REPORT_PERIODS.map((option) => (
            <Link
              key={option}
              href={`/admin/relatorios?period=${option}`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                !hasCustomRange && option === period
                  ? "bg-brand text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {REPORT_PERIOD_LABELS[option]}
            </Link>
          ))}
        </div>

        <form className="flex flex-wrap items-center gap-2 text-sm" action="/admin/relatorios">
          <input
            type="date"
            name="from"
            defaultValue={hasCustomRange ? from : undefined}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <span className="text-zinc-400">até</span>
          <input
            type="date"
            name="to"
            defaultValue={hasCustomRange ? to : undefined}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              hasCustomRange ? "bg-brand text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Aplicar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500">Faturamento</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{formatCents(report.revenueCents)}</p>
          {report.revenueChangePct !== null && (
            <p className={`mt-0.5 text-xs font-medium ${report.revenueChangePct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {report.revenueChangePct >= 0 ? "+" : ""}
              {(report.revenueChangePct * 100).toFixed(1)}% vs. período anterior
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500">Pedidos</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{report.orderCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500">Ticket médio</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{formatCents(report.averageTicketCents)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500">Cancelados</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{report.cancelledCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500">Novos clientes</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{report.newCustomersCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-xs text-zinc-500">Visitas ao cardápio</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{report.menuViewsCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 sm:col-span-2">
          <p className="text-xs text-zinc-500">Taxa de conversão</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">
            {report.conversionRate === null ? "—" : `${(report.conversionRate * 100).toFixed(1)}%`}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">Pedidos ÷ visitas ao cardápio no período</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-700">Receita no período</h2>
        <div className="mt-4">
          <RevenueChart points={report.chartPoints} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-700">Top 5 produtos mais vendidos</h2>
        {top5.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Nenhuma venda neste período.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">Produto</th>
                <th className="pb-2 font-medium">Qtd. vendida</th>
                <th className="pb-2 font-medium">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((item) => (
                <tr key={item.name} className="border-b border-zinc-50 last:border-0">
                  <td className="py-2 text-zinc-900">{item.name}</td>
                  <td className="py-2 text-zinc-600">{item.quantity}</td>
                  <td className="py-2 text-zinc-600">{formatCents(item.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rest.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-brand-dark hover:underline">
              Detalhes (ver todos os {report.topItems.length} produtos)
            </summary>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {rest.map((item) => (
                  <tr key={item.name} className="border-b border-zinc-50 last:border-0">
                    <td className="py-2 text-zinc-900">{item.name}</td>
                    <td className="py-2 text-zinc-600">{item.quantity}</td>
                    <td className="py-2 text-zinc-600">{formatCents(item.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </div>
  );
}
