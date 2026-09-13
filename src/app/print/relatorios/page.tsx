import { requireSession, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { isReportPeriod, isValidDateString, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/reports/period";
import { getReportData } from "@/lib/reports/getReportData";
import { PrintButton } from "../orders/PrintButton";

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const session = await requireSession();
  requirePermission(session, "reports");
  const { period: rawPeriod, from, to } = await searchParams;
  const period: ReportPeriod = isReportPeriod(rawPeriod) ? rawPeriod : "dia";
  const periodLabel =
    isValidDateString(from) && isValidDateString(to) ? `${from} a ${to}` : REPORT_PERIOD_LABELS[period];

  const [store, report] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: session.storeId }, select: { name: true } }),
    getReportData(session.storeId, { period, from, to }),
  ]);

  return (
    <div className="mx-auto max-w-lg bg-white p-8 print:p-0">
      <h1 className="text-xl font-bold text-zinc-900">Relatório de vendas — {store.name}</h1>
      <p className="text-sm text-zinc-500">
        {periodLabel} · Gerado em {new Date().toLocaleString("pt-BR")}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Faturamento</dt>
          <dd className="font-semibold text-zinc-900">{formatCents(report.revenueCents)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Pedidos</dt>
          <dd className="font-semibold text-zinc-900">{report.orderCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Ticket médio</dt>
          <dd className="font-semibold text-zinc-900">{formatCents(report.averageTicketCents)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Cancelados</dt>
          <dd className="font-semibold text-zinc-900">{report.cancelledCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Novos clientes</dt>
          <dd className="font-semibold text-zinc-900">{report.newCustomersCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Taxa de conversão</dt>
          <dd className="font-semibold text-zinc-900">
            {report.conversionRate === null ? "—" : `${(report.conversionRate * 100).toFixed(1)}%`}
          </dd>
        </div>
      </dl>

      <h2 className="mt-6 text-sm font-semibold text-zinc-700">Itens mais vendidos</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
            <th className="pb-1 font-medium">Produto</th>
            <th className="pb-1 font-medium">Qtd.</th>
            <th className="pb-1 font-medium">Faturamento</th>
          </tr>
        </thead>
        <tbody>
          {report.topItems.map((item) => (
            <tr key={item.name} className="border-b border-zinc-100 last:border-0">
              <td className="py-1 text-zinc-900">{item.name}</td>
              <td className="py-1 text-zinc-600">{item.quantity}</td>
              <td className="py-1 text-zinc-600">{formatCents(item.revenueCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-xs text-zinc-400 print:hidden">
        Use o botão abaixo e escolha &quot;Salvar como PDF&quot; na tela de impressão do navegador.
      </p>
      <PrintButton />
    </div>
  );
}
