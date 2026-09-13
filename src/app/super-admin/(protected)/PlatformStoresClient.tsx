"use client";

import { useState } from "react";
import { formatCents } from "@/lib/money";
import { StoreEditModal, type StoreModalData } from "./StoreEditModal";

export type StoreRow = StoreModalData & {
  statusLabel: "Ativa" | "Inativa" | "Em teste";
  createdAt: Date;
};

export function PlatformStoresClient({ stores }: { stores: StoreRow[] }) {
  const [selected, setSelected] = useState<StoreRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Loja</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Receita mensal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {stores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Nenhuma loja encontrada.
                </td>
              </tr>
            )}
            {stores.map((store) => (
              <tr
                key={store.id}
                onClick={() => setSelected(store)}
                className="cursor-pointer hover:bg-zinc-50"
              >
                <td className="px-4 py-3 font-medium text-zinc-900">{store.name}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {store.owner ? (
                    <>
                      {store.owner.name}
                      <br />
                      <span className="text-xs text-zinc-400">{store.owner.email}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      store.statusLabel === "Ativa"
                        ? "bg-emerald-100 text-emerald-700"
                        : store.statusLabel === "Em teste"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {store.statusLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">{store.createdAt.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {store.planMonthlyCents ? formatCents(store.planMonthlyCents) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Editar →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <StoreEditModal store={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
