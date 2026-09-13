import { formatCents } from "@/lib/money";
import type { PlatformChartPoint } from "@/lib/platformReports";

export function PlatformRevenueChart({ points }: { points: PlatformChartPoint[] }) {
  const maxCents = Math.max(1, ...points.map((p) => p.revenueCents));
  const width = 640;
  const height = 160;
  const gap = 4;
  const barWidth = points.length > 0 ? width / points.length - gap : 0;
  const labelEvery = Math.ceil(points.length / 12) || 1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 20}`}
      className="w-full"
      role="img"
      aria-label="Receita mensal recorrente da plataforma ao longo do tempo"
    >
      {points.map((point, index) => {
        const barHeight = (point.revenueCents / maxCents) * height;
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        return (
          <g key={index}>
            <rect x={x} y={y} width={Math.max(barWidth, 1)} height={Math.max(barHeight, 1)} rx={2} className="fill-zinc-900">
              <title>
                {point.label}: {formatCents(point.revenueCents)} MRR · +{point.newSubscriptions} novas ·
                −{point.cancellations} canceladas
              </title>
            </rect>
            {index % labelEvery === 0 && (
              <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" className="fill-zinc-400 text-[9px]">
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
