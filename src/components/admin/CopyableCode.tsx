"use client";

import { useState } from "react";

export function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sem permissão de clipboard: o valor continua selecionável na tela.
    }
  }

  return (
    <div className="mt-1 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <code className="flex-1 break-all text-xs text-zinc-800">{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
