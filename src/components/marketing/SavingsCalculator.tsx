"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/money";
import { ZAPFOOD_MONTHLY_PRICE_CENTS } from "@/lib/pricing";

export function SavingsCalculator() {
  const [ordersPerMonth, setOrdersPerMonth] = useState(300);
  const [avgTicket, setAvgTicket] = useState(35);
  const [commissionPercent, setCommissionPercent] = useState(20);

  const { competitorCostCents, savingsCents } = useMemo(() => {
    const revenueCents = ordersPerMonth * avgTicket * 100;
    const competitorCostCents = Math.round((revenueCents * commissionPercent) / 100);
    const savingsCents = competitorCostCents - ZAPFOOD_MONTHLY_PRICE_CENTS;
    return { competitorCostCents, savingsCents };
  }, [ordersPerMonth, avgTicket, commissionPercent]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="overflow-hidden rounded-3xl bg-zinc-900 text-white shadow-xl">
        <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Calcule quanto você economiza com o ZapFood
            </h2>
            <p className="mt-3 text-zinc-300">
              Compare a mensalidade fixa do ZapFood com o que apps de delivery cobram em
              comissão por pedido.
            </p>

            <div className="mt-8 flex flex-col gap-6">
              <label className="flex flex-col gap-2 text-sm">
                Pedidos por mês
                <input
                  type="range"
                  min={30}
                  max={2000}
                  step={10}
                  value={ordersPerMonth}
                  onChange={(event) => setOrdersPerMonth(Number(event.target.value))}
                  className="accent-brand"
                />
                <span className="font-semibold text-white">{ordersPerMonth} pedidos</span>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Ticket médio
                <input
                  type="range"
                  min={10}
                  max={150}
                  step={1}
                  value={avgTicket}
                  onChange={(event) => setAvgTicket(Number(event.target.value))}
                  className="accent-brand"
                />
                <span className="font-semibold text-white">
                  {formatCents(avgTicket * 100)}
                </span>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                Comissão do concorrente
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={commissionPercent}
                  onChange={(event) => setCommissionPercent(Number(event.target.value))}
                  className="accent-brand"
                />
                <span className="font-semibold text-white">{commissionPercent}%</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6 rounded-2xl bg-white/5 p-8">
            <div>
              <p className="text-sm text-zinc-300">Você pagaria em comissões</p>
              <p className="text-3xl font-bold text-white">
                {formatCents(competitorCostCents)}
                <span className="text-base font-normal text-zinc-400">/mês</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-300">Com o ZapFood você paga</p>
              <p className="text-3xl font-bold text-white">
                {formatCents(ZAPFOOD_MONTHLY_PRICE_CENTS)}
                <span className="text-base font-normal text-zinc-400">/mês</span>
              </p>
            </div>
            <div className="rounded-xl bg-brand/20 p-4">
              <p className="text-sm text-emerald-200">Economia estimada</p>
              <p className="text-3xl font-extrabold text-emerald-300">
                {formatCents(Math.max(savingsCents, 0))}
                <span className="text-base font-normal text-emerald-200">/mês</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
