"use client";

import { useActionState } from "react";
import { updateDefaultPlanAction, type PlatformSettingsState } from "./actions";

const initialState: PlatformSettingsState = {};

export function PlanPriceForm({ currentReais }: { currentReais: number }) {
  const [state, formAction, pending] = useActionState(updateDefaultPlanAction, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="priceReais" className="block text-sm font-medium text-zinc-700">
          Mensalidade (R$)
        </label>
        <input
          id="priceReais"
          name="priceReais"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={currentReais.toFixed(2)}
          className="mt-1 w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-emerald-600">Valor atualizado.</p>}
    </form>
  );
}
