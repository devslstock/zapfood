"use client";

import { useState } from "react";
import { formatCents } from "@/lib/money";

type Point = { label: string; revenueCents: number; ordersCount: number };
type Metric = "revenue" | "orders";

export function RevenueChart({ points }: { points: Point[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const values = points.map((p) => (metric === "revenue" ? p.revenueCents : p.ordersCount));
  const maxValue = Math.max(1, ...values);
  const width = 640;
  const height = 180;
  const gap = 4;
  const barWidth = points.length > 0 ? width / points.length - gap : 0;
  // Nem toda label cabe sem virar poluição visual — mostra só um subconjunto.
  const labelEvery = Math.ceil(points.length / 12) || 1;

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMetric("revenue")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            metric === "revenue" ? "bg-brand text-white" : "border border-zinc-300 text-zinc-600"
          }`}
        >
          Receita
        </button>
        <button
          type="button"
          onClick={() => setMetric("orders")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            metric === "orders" ? "bg-brand text-white" : "border border-zinc-300 text-zinc-600"
          }`}
        >
          Pedidos
        </button>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        className="w-full"
        role="img"
        aria-label={metric === "revenue" ? "Gráfico de receita ao longo do período" : "Gráfico de pedidos ao longo do período"}
      >
        {points.map((point, index) => {
          const value = metric === "revenue" ? point.revenueCents : point.ordersCount;
          const barHeight = (value / maxValue) * height;
          const x = index * (barWidth + gap);
          const y = height - barHeight;
          const tooltip = metric === "revenue" ? formatCents(point.revenueCents) : `${point.ordersCount} pedido(s)`;
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={Math.max(barWidth, 1)}
                height={Math.max(barHeight, 1)}
                rx={2}
                className="fill-brand/70"
              >
                <title>
                  {point.label}: {tooltip}
                </title>
              </rect>
              {index % labelEvery === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={height + 14}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[9px]"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
