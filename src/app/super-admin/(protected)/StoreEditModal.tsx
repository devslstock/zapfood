"use client";

import { formatCents } from "@/lib/money";
import { ResetPasswordButton } from "./[storeId]/ResetPasswordButton";
import { ToggleActiveButton } from "./[storeId]/ToggleActiveButton";
import { updatePlanPriceAction } from "./[storeId]/actions";

export type StoreModalData = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  cnpjCpf: string | null;
  planMonthlyCents: number | null;
  orderCount: number;
  owner: { name: string; email: string; emailVerifiedAt: Date | null } | null;
};

export function StoreEditModal({ store, onClose }: { store: StoreModalData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{store.name}</h2>
            <p className="text-sm text-zinc-500">
              /{store.slug} · {store.orderCount} pedido(s) · {store.cnpjCpf ?? "sem CPF/CNPJ"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-zinc-400 hover:text-zinc-600">
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <section className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm font-semibold text-zinc-900">Dono(a) e acesso</p>
            {store.owner ? (
              <p className="mt-1 text-sm text-zinc-600">
                {store.owner.name} · {store.owner.email}
                <br />
                E-mail {store.owner.emailVerifiedAt ? "confirmado" : "ainda não confirmado"}
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">Nenhum(a) dono(a) cadastrado(a).</p>
            )}
            <div className="mt-3">
              <ResetPasswordButton storeId={store.id} />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm font-semibold text-zinc-900">Acesso da loja</p>
            <div className="mt-3">
              <ToggleActiveButton storeId={store.id} active={store.active} />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm font-semibold text-zinc-900">Mensalidade</p>
            <form action={updatePlanPriceAction.bind(null, store.id)} className="mt-3 flex items-end gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-500">Valor (R$)</label>
                <input
                  name="planMonthlyReais"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={store.planMonthlyCents ? (store.planMonthlyCents / 100).toFixed(2) : ""}
                  placeholder="Padrão da plataforma"
                  className="mt-1 w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                Salvar
              </button>
            </form>
            {store.planMonthlyCents != null && (
              <p className="mt-1 text-xs text-zinc-400">
                Cobrando {formatCents(store.planMonthlyCents)}/mês desta loja especificamente.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
