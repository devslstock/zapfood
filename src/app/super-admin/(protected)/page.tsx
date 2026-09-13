import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import {
  getPlatformReportData,
  isPlatformPeriod,
  PLATFORM_PERIODS,
  PLATFORM_PERIOD_LABELS,
  type PlatformPeriod,
} from "@/lib/platformReports";
import { PlatformRevenueChart } from "@/components/superadmin/PlatformRevenueChart";
import { NewStoreModal } from "./NewStoreModal";
import { PlatformStoresClient, type StoreRow } from "./PlatformStoresClient";

const PAGE_SIZE = 20;
const STATUS_TABS = ["todas", "ativa", "inativa", "teste"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function isStatusTab(value: string | undefined): value is StatusTab {
  return !!value && (STATUS_TABS as readonly string[]).includes(value);
}

export default async function PlatformStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; chartPeriod?: string }>;
}) {
  const { q, status: rawStatus, page: rawPage, chartPeriod: rawChartPeriod } = await searchParams;
  const search = (q ?? "").trim().toLowerCase();
  const status: StatusTab = isStatusTab(rawStatus) ? rawStatus : "todas";
  const page = Math.max(1, Number(rawPage) || 1);
  const chartPeriod: PlatformPeriod = isPlatformPeriod(rawChartPeriod) ? rawChartPeriod : "30d";

  const [allStores, report] = await Promise.all([
    prisma.store.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        staff: { where: { role: "OWNER" }, take: 1 },
        _count: { select: { orders: true } },
      },
    }),
    getPlatformReportData(chartPeriod),
  ]);

  const now = new Date();
  function deriveStatus(store: (typeof allStores)[number]): StatusTab {
    if (!store.active) return "inativa";
    if (store.trialEndsAt && store.trialEndsAt > now) return "teste";
    return "ativa";
  }

  const totalAtivas = allStores.filter((s) => deriveStatus(s) === "ativa").length;
  const totalTeste = allStores.filter((s) => deriveStatus(s) === "teste").length;
  const totalInativas = allStores.filter((s) => deriveStatus(s) === "inativa").length;

  const filtered = allStores.filter((store) => {
    const matchesStatus = status === "todas" || deriveStatus(store) === status;
    if (!matchesStatus) return false;
    if (!search) return true;
    const owner = store.staff[0];
    return (
      store.name.toLowerCase().includes(search) ||
      store.slug.toLowerCase().includes(search) ||
      (store.cnpjCpf ?? "").toLowerCase().includes(search) ||
      (owner?.email.toLowerCase().includes(search) ?? false)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStores = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const statusLabels: Record<StatusTab, string> = {
    todas: "Todas",
    ativa: "Ativa",
    inativa: "Inativa",
    teste: "Teste",
  };

  const rows: StoreRow[] = pageStores.map((store) => {
    const derived = deriveStatus(store);
    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      active: store.active,
      cnpjCpf: store.cnpjCpf,
      planMonthlyCents: store.planMonthlyCents,
      orderCount: store._count.orders,
      owner: store.staff[0]
        ? { name: store.staff[0].name, email: store.staff[0].email, emailVerifiedAt: store.staff[0].emailVerifiedAt }
        : null,
      statusLabel: derived === "ativa" ? "Ativa" : derived === "teste" ? "Em teste" : "Inativa",
      createdAt: store.createdAt,
    };
  });

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, status: status === "todas" ? undefined : status, chartPeriod, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    return `/super-admin?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lojas clientes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {allStores.length} loja(s) cadastrada(s) no total.
          </p>
        </div>
        <NewStoreModal />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="text-xs text-zinc-500">Lojas ativas</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{totalAtivas}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="text-xs text-zinc-500">Lojas em teste</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{totalTeste}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="text-xs text-zinc-500">Lojas inativas</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{totalInativas}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="text-xs text-zinc-500">Receita mensal (MRR)</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{formatCents(report.currentMrrCents)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-700">Receita global da plataforma</h2>
          <div className="flex gap-2">
            {PLATFORM_PERIODS.map((option) => (
              <Link
                key={option}
                href={buildQuery({ chartPeriod: option })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  option === chartPeriod
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {PLATFORM_PERIOD_LABELS[option]}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Receita total (MRR atual)</p>
            <p className="font-semibold text-zinc-900">{formatCents(report.currentMrrCents)}</p>
          </div>
          <div>
            <p className="text-zinc-500">Novas assinaturas</p>
            <p className="font-semibold text-zinc-900">{report.totalNewSubscriptions}</p>
          </div>
          <div>
            <p className="text-zinc-500">Cancelamentos</p>
            <p className="font-semibold text-zinc-900">{report.totalCancellations}</p>
          </div>
        </div>
        <div className="mt-4">
          <PlatformRevenueChart points={report.points} />
        </div>
        <div className="mt-4">
          <a
            href={`/api/super-admin/relatorio/export?period=${chartPeriod}`}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Exportar relatório
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab}
              href={buildQuery({ status: tab === "todas" ? undefined : tab, page: undefined })}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                status === tab ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {statusLabels[tab]}
            </Link>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form className="flex w-full flex-wrap items-center gap-2 sm:w-auto" action="/super-admin">
            {status !== "todas" && <input type="hidden" name="status" value={status} />}
            <input
              type="hidden"
              name="chartPeriod"
              value={chartPeriod}
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar por nome, domínio ou CPF/CNPJ"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 sm:w-64"
            />
            <button
              type="submit"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Buscar
            </button>
          </form>
          <a
            href="/api/super-admin/lojas/export"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Exportar lojas
          </a>
        </div>
      </div>

      <PlatformStoresClient stores={rows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildQuery({ page: String(pageNumber) })}
              className={`rounded-full px-3 py-1.5 font-medium ${
                pageNumber === currentPage
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
