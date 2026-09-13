export const REPORT_PERIODS = ["dia", "semana", "mes", "ano"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  dia: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
  ano: "Este ano",
};

export function isReportPeriod(value: string | undefined): value is ReportPeriod {
  return !!value && (REPORT_PERIODS as readonly string[]).includes(value);
}

// Intervalo [start, end) no horário local do servidor — igual ao resto do
// app, que não faz tratamento explícito de fuso horário.
export function getPeriodRange(period: ReportPeriod, now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "dia") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (period === "semana") {
    // Semana de segunda a domingo.
    const weekday = (start.getDay() + 6) % 7; // 0 = segunda
    start.setDate(start.getDate() - weekday);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  if (period === "mes") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start: monthStart, end };
  }

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  return { start: yearStart, end };
}

// Mesma duração, período imediatamente anterior — usado para calcular a
// variação % exibida ao lado do faturamento total.
export function getPreviousPeriodRange(start: Date, end: Date): { start: Date; end: Date } {
  const durationMs = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - durationMs), end: new Date(start) };
}

export function isValidDateString(value: string | undefined | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Intervalo [start, end) a partir de um campo de datas personalizado
// (input type="date", inclusivo nas duas pontas na UI).
export function getCustomRange(fromStr: string, toStr: string): { start: Date; end: Date } {
  const [fy, fm, fd] = fromStr.split("-").map(Number);
  const [ty, tm, td] = toStr.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  end.setDate(end.getDate() + 1);
  return { start, end: end > start ? end : new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export type ChartBucket = { label: string; start: Date; end: Date };

// Buckets para um intervalo personalizado (sem período fixo pra guiar a
// resolução): por dia se couber num gráfico legível, por mês se for longo.
export function getCustomChartBuckets(start: Date, end: Date): ChartBucket[] {
  const totalDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const buckets: ChartBucket[] = [];

  if (totalDays <= 62) {
    const cursor = new Date(start);
    while (cursor < end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(cursor);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      buckets.push({
        label: bucketStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        start: bucketStart,
        end: bucketEnd,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor < end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    buckets.push({
      label: bucketStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
      start: bucketStart,
      end: bucketEnd,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

// Resolução do gráfico de vendas: por hora no dia, por dia na semana/mês,
// por mês no ano — 365 barras diárias não caberiam num gráfico simples.
export function getChartBuckets(period: ReportPeriod, start: Date, end: Date): ChartBucket[] {
  const buckets: ChartBucket[] = [];

  if (period === "dia") {
    for (let hour = 0; hour < 24; hour++) {
      const bucketStart = new Date(start);
      bucketStart.setHours(hour, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(hour + 1, 0, 0, 0);
      buckets.push({ label: `${String(hour).padStart(2, "0")}h`, start: bucketStart, end: bucketEnd });
    }
    return buckets;
  }

  if (period === "ano") {
    for (let month = 0; month < 12; month++) {
      const bucketStart = new Date(start.getFullYear(), month, 1);
      const bucketEnd = new Date(start.getFullYear(), month + 1, 1);
      buckets.push({
        label: bucketStart.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        start: bucketStart,
        end: bucketEnd,
      });
    }
    return buckets;
  }

  // semana / mês: um bucket por dia.
  const cursor = new Date(start);
  while (cursor < end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + 1);
    buckets.push({
      label: String(bucketStart.getDate()),
      start: bucketStart,
      end: bucketEnd,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}
