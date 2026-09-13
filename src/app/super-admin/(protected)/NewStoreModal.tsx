"use client";

import { useActionState, useState } from "react";
import { createStoreAction, type CreateStoreState } from "./actions";

const initialState: CreateStoreState = {};

export function NewStoreModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createStoreAction, initialState);

  // Fecha o modal quando a criação tem sucesso — ajusta o estado durante a
  // própria renderização (padrão recomendado pelo React) em vez de um
  // useEffect, que geraria um re-render extra.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        Nova loja
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Nova loja</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Mesmo fluxo do cadastro público: a loja recebe um e-mail de confirmação e a
              assinatura no Asaas é configurada automaticamente.
            </p>

            <form action={formAction} className="mt-4 flex flex-col gap-3">
              <input
                name="storeName"
                required
                placeholder="Nome da loja"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <input
                name="ownerName"
                required
                placeholder="Nome do dono(a)"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="E-mail do dono(a)"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Senha provisória"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <input
                name="cpfCnpj"
                required
                placeholder="CPF ou CNPJ"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <input
                name="whatsappContactPhone"
                required
                placeholder="Telefone/WhatsApp"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <input
                name="category"
                required
                placeholder="Categoria (ex: Pizzaria)"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />

              {state.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="mt-2 rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
              >
                {pending ? "Criando..." : "Criar loja"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
