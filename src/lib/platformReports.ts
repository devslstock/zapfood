import "server-only";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/platformSettings";

export const PLATFORM_PERIODS = ["7d", "30d", "12m"] as const;
export type PlatformPeriod = (typeof PLATFORM_PERIODS)[number];

export const PLATFORM_PERIOD_LABELS: Record<PlatformPeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "12m": "12 meses",
};

export function isPlatformPeriod(value: string | undefined): value is PlatformPeriod {
  return !!value && (PLATFORM_PERIODS as readonly string[]).includes(value);
}

export type PlatformChartPoint = {
  label: string;
  revenueCents: number;
  newSubscriptions: number;
  cancellations: number;
};

export type PlatformReportData = {
  points: PlatformChartPoint[];
  currentMrrCents: number;
  totalNewSubscriptions: number;
  totalCancellations: number;
};

// "Receita Global da Plataforma" = a mensalidade que o ZaapFood recebe de
// cada loja ativa (MRR), não o faturamento somado das vendas de todas as
// lojas. Cada ponto do gráfico mostra o MRR "como estava" no fim daquele
// bucket — permite ver o crescimento/queda da receita da própria plataforma
// ao longo do tempo, junto com quantas lojas entraram/saíram naquele bucket.
export async function getPlatformReportData(period: PlatformPeriod): Promise<PlatformReportData> {
  const stores = await prisma.store.findMany({
    select: { createdAt: true, deactivatedAt: true, active: true, planMonthlyCents: true },
  });
  const settings = await getPlatformSettings();
  const defaultPlan = settings.defaultPlanMonthlyCents;
  const planOf = (store: { planMonthlyCents: number | null }) => store.planMonthlyCents ?? defaultPlan;

  const now = new Date();
  const buckets: { label: string; end: Date }[] = [];

  if (period === "12m") {
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        label: end.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        end,
      });
    }
  } else {
    const days = period === "7d" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      buckets.push({
        label: end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        end,
      });
    }
  }

  const points: PlatformChartPoint[] = buckets.map((bucket, index) => {
    const bucketStart = index === 0 ? new Date(0) : buckets[index - 1].end;
    const mrrCents = stores
      .filter(
        (store) =>
          store.createdAt < bucket.end && (!store.deactivatedAt || store.deactivatedAt >= bucket.end)
      )
      .reduce((sum, store) => sum + planOf(store), 0);
    const newSubscriptions = stores.filter(
      (store) => store.createdAt >= bucketStart && store.createdAt < bucket.end
    ).length;
    const cancellations = stores.filter(
      (store) => store.deactivatedAt && store.deactivatedAt >= bucketStart && store.deactivatedAt < bucket.end
    ).length;
    return { label: bucket.label, revenueCents: mrrCents, newSubscriptions, cancellations };
  });

  return {
    points,
    currentMrrCents: stores.filter((s) => s.active).reduce((sum, s) => sum + planOf(s), 0),
    totalNewSubscriptions: points.reduce((sum, p) => sum + p.newSubscriptions, 0),
    totalCancellations: points.reduce((sum, p) => sum + p.cancellations, 0),
  };
}
