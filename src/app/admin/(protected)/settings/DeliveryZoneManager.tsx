"use client";

import { formatCents } from "@/lib/money";
import { createDeliveryZoneAction, deleteDeliveryZoneAction } from "./actions";

export type DeliveryZoneRow = { id: string; neighborhood: string; feeCents: number };

export function DeliveryZoneManager({ zones }: { zones: DeliveryZoneRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {zones.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum bairro cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {zones.map((zone) => (
            <li key={zone.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="font-medium text-zinc-900">{zone.neighborhood}</span>
              <div className="flex items-center gap-4">
                <span className="text-zinc-600">{formatCents(zone.feeCents)}</span>
                <form action={deleteDeliveryZoneAction.bind(null, zone.id)}>
                  <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                    Remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={createDeliveryZoneAction} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-zinc-500">Bairro</label>
          <input
            name="neighborhood"
            required
            placeholder="Ex: Centro"
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">Taxa (R$)</label>
          <input
            name="feeReais"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0,00"
            className="mt-1 w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Adicionar bairro
        </button>
      </form>
    </div>
  );
}
