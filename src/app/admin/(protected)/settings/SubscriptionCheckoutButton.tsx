"use client";

import { useActionState, useEffect } from "react";
import { startAsaasCheckoutAction, type StartCheckoutState } from "./actions";

const initialState: StartCheckoutState = {};

export function SubscriptionCheckoutButton({ hasSubscription }: { hasSubscription: boolean }) {
  const [state, formAction, pending] = useActionState(startAsaasCheckoutAction, initialState);

  useEffect(() => {
    if (state.url) {
      window.open(state.url, "_blank", "noopener,noreferrer");
    }
  }, [state.url]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending
          ? "Gerando link..."
          : hasSubscription
            ? "Atualizar forma de pagamento"
            : "Configurar pagamento"}
      </button>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
      {state.url && (
        <p className="mt-2 text-xs text-zinc-500">
          Abrimos a fatura em uma nova aba.{" "}
          <a href={state.url} target="_blank" rel="noopener noreferrer" className="underline">
            Não abriu? Clique aqui
          </a>
          .
        </p>
      )}
    </form>
  );
}
