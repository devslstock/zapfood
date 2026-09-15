"use client";

import { useState, type ReactNode } from "react";
import type { WhatsappProvider } from "@/lib/domain";

// Alterna entre os dois jeitos de conectar o WhatsApp sem afetar nenhum dos
// dois fluxos em si — o conteúdo de cada aba (Meta em `children`, Evolution
// em `evolutionPanel`) é renderizado exatamente como já era, só escondido/
// mostrado por CSS, então trocar de aba nunca reseta o formulário da Meta
// nem o estado do painel de QR Code.
export function WhatsappConnectionTabs({
  initialProvider,
  evolutionPanel,
  children,
}: {
  initialProvider: WhatsappProvider;
  evolutionPanel: ReactNode;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<WhatsappProvider>(initialProvider === "EVOLUTION" ? "EVOLUTION" : "META");

  return (
    <div className="mt-4">
      <div className="flex gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setTab("EVOLUTION")}
          className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "EVOLUTION"
              ? "border-brand text-brand-dark"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Conectar via QR Code
        </button>
        <button
          type="button"
          onClick={() => setTab("META")}
          className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "META"
              ? "border-brand text-brand-dark"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Meta Cloud API (avançado)
        </button>
      </div>

      <div className={tab === "EVOLUTION" ? "block" : "hidden"}>{evolutionPanel}</div>
      <div className={tab === "META" ? "block" : "hidden"}>{children}</div>
    </div>
  );
}
