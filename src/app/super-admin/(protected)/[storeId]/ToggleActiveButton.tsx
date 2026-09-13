"use client";

import { toggleActiveAction } from "./actions";

export function ToggleActiveButton({ storeId, active }: { storeId: string; active: boolean }) {
  return (
    <form
      action={async () => {
        const message = active
          ? "Desativar esta loja? O admin, o cardápio público e o WhatsApp param de funcionar imediatamente."
          : "Reativar esta loja?";
        if (!window.confirm(message)) return;
        await toggleActiveAction(storeId);
      }}
    >
      <button
        type="submit"
        className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
          active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {active ? "Desativar loja" : "Reativar loja"}
      </button>
    </form>
  );
}
