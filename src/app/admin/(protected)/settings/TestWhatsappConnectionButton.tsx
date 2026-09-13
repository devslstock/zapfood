"use client";

import { useState, useTransition } from "react";
import { testWhatsappConnectionAction, type TestConnectionState } from "./actions";

export function TestWhatsappConnectionButton() {
  const [result, setResult] = useState<TestConnectionState>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await testWhatsappConnectionAction()))}
        className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        {pending ? "Testando..." : "Testar Conexão"}
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
