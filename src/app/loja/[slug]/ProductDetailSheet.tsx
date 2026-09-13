"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/money";
import type { Product, SelectedOption } from "./types";

export function ProductDetailSheet({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (input: { quantity: number; selectedOptions: SelectedOption[] }) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  // groupId -> Set<optionId>
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});

  function toggleOption(groupId: string, optionId: string, maxSelect: number) {
    setSelections((prev) => {
      const current = new Set(prev[groupId] ?? []);
      if (maxSelect === 1) {
        return { ...prev, [groupId]: current.has(optionId) ? new Set() : new Set([optionId]) };
      }
      if (current.has(optionId)) {
        current.delete(optionId);
      } else if (current.size < maxSelect) {
        current.add(optionId);
      }
      return { ...prev, [groupId]: current };
    });
  }

  const selectedOptions: SelectedOption[] = useMemo(() => {
    const result: SelectedOption[] = [];
    for (const group of product.optionGroups) {
      const chosen = selections[group.id];
      if (!chosen) continue;
      for (const option of group.options) {
        if (chosen.has(option.id)) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            name: option.name,
            priceCents: option.priceCents,
          });
        }
      }
    }
    return result;
  }, [selections, product.optionGroups]);

  const missingRequiredGroup = product.optionGroups.find(
    (group) => group.minSelect > 0 && (selections[group.id]?.size ?? 0) < group.minSelect
  );

  const optionsTotalCents = selectedOptions.reduce((sum, option) => sum + option.priceCents, 0);
  const totalCents = (product.priceCents + optionsTotalCents) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl">
        <div className="relative">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-32 w-full items-center justify-center bg-zinc-100 text-4xl">
              🍽️
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-bold text-zinc-900">{product.name}</h3>
          {product.description && (
            <p className="mt-2 text-sm text-zinc-600">{product.description}</p>
          )}
          <p className="mt-3 text-base font-semibold text-zinc-900">
            {formatCents(product.priceCents)}
          </p>

          {product.optionGroups.map((group) => (
            <div key={group.id} className="mt-5 border-t border-zinc-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">{group.name}</p>
                  <p className="text-xs text-zinc-500">
                    {group.maxSelect === 1
                      ? "Escolha 1 opção"
                      : `Escolha até ${group.maxSelect} opções`}
                  </p>
                </div>
                {group.minSelect > 0 && (
                  <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                    Obrigatório
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {group.options.map((option) => {
                  const checked = selections[group.id]?.has(option.id) ?? false;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        checked ? "border-brand bg-brand/5" : "border-zinc-200"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={group.maxSelect === 1 ? "radio" : "checkbox"}
                          name={`group-${group.id}`}
                          checked={checked}
                          onChange={() => toggleOption(group.id, option.id, group.maxSelect)}
                          className="text-brand"
                        />
                        {option.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={option.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded-md object-cover"
                          />
                        )}
                        {option.name}
                      </span>
                      {option.priceCents > 0 && (
                        <span className="text-zinc-500">+{formatCents(option.priceCents)}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-4 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-600"
              >
                −
              </button>
              <span className="w-4 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!!missingRequiredGroup}
              onClick={() => onAdd({ quantity, selectedOptions })}
              className="flex-1 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {missingRequiredGroup
                ? `Escolha "${missingRequiredGroup.name}"`
                : `Adicionar — ${formatCents(totalCents)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
