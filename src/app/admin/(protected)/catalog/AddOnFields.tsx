"use client";

import { useState } from "react";

type AddOnRow = { key: number; name?: string; price?: number };

export function AddOnFields({
  initial = [],
}: {
  initial?: { name: string; priceCents: number }[];
}) {
  const [rows, setRows] = useState<AddOnRow[]>(
    initial.map((item, index) => ({ key: index, name: item.name, price: item.priceCents / 100 }))
  );
  const [nextKey, setNextKey] = useState(initial.length);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-zinc-700">Adicionais (opcional)</span>
        <button
          type="button"
          onClick={() => {
            setRows((prev) => [...prev, { key: nextKey }]);
            setNextKey((key) => key + 1);
          }}
          className="text-sm font-medium text-brand-dark hover:underline"
        >
          + adicionar
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.key} className="flex gap-2">
            <input
              name="addOnName"
              defaultValue={row.name}
              placeholder="Granulado"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <input
              name="addOnPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={row.price}
              placeholder="1.00"
              className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              className="text-sm text-red-600 hover:underline"
            >
              remover
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-zinc-400">Nenhum adicional. Clique em &quot;+ adicionar&quot;.</p>
        )}
      </div>
    </div>
  );
}
