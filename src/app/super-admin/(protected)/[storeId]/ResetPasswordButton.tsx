"use client";

import { useActionState } from "react";
import { resetOwnerPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordButton({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState(
    resetOwnerPasswordAction.bind(null, storeId),
    initialState
  );

  return (
    <div className="flex flex-col gap-2">
      <form
        action={(formData) => {
          if (!window.confirm("Gerar uma nova senha provisória para o dono(a) desta loja?")) {
            return;
          }
          formAction(formData);
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
        >
          {pending ? "Gerando..." : "Resetar senha do dono(a)"}
        </button>
      </form>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state.newPassword && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Nova senha gerada — copie e repasse ao cliente, ela não será mostrada de novo:
          <br />
          <code className="mt-1 block select-all rounded bg-white px-2 py-1 font-mono text-zinc-900">
            {state.newPassword}
          </code>
        </div>
      )}
    </div>
  );
}
