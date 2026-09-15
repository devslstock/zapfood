"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  startEvolutionConnectionAction,
  checkEvolutionConnectionStatusAction,
  disconnectEvolutionAction,
} from "./evolutionActions";

const POLL_INTERVAL_MS = 3000;
const QR_TIMEOUT_MS = 2 * 60 * 1000;

export function EvolutionConnectPanel({
  hasAcceptedRisk,
  isConnected,
}: {
  hasAcceptedRisk: boolean;
  isConnected: boolean;
}) {
  const [riskChecked, setRiskChecked] = useState(hasAcceptedRisk);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(isConnected);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current = null;
    timeoutRef.current = null;
  }

  useEffect(() => stopPolling, []);

  function startPolling() {
    stopPolling();
    setExpired(false);
    pollRef.current = setInterval(async () => {
      const { state } = await checkEvolutionConnectionStatusAction();
      if (state === "open") {
        stopPolling();
        setConnected(true);
        setQrCodeDataUrl(null);
      }
    }, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setExpired(true);
    }, QR_TIMEOUT_MS);
  }

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      const result = await startEvolutionConnectionAction(riskChecked);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setExpired(false);
      startPolling();
    });
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const result = await disconnectEvolutionAction();
      if (!result.ok) {
        setError(result.error ?? "Não foi possível desconectar.");
        return;
      }
      stopPolling();
      setConnected(false);
      setQrCodeDataUrl(null);
      setExpired(false);
    });
  }

  if (connected) {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <p className="text-sm text-zinc-600">
          WhatsApp conectado via QR Code (Evolution API). As mensagens da loja passam a entrar e
          sair por essa conexão.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={handleDisconnect}
          className="self-start rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? "Desconectando..." : "Desconectar"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {!hasAcceptedRisk && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Antes de conectar, leia com atenção</p>
          <p className="mt-1">
            Essa conexão usa o protocolo do WhatsApp Web (não é a API oficial da Meta). Por isso,
            o WhatsApp pode bloquear este número a qualquer momento, sem aviso prévio, por
            considerar automação não autorizada — é um risco real, mesmo sendo uma prática comum.{" "}
            <strong>A ZaapFood não se responsabiliza por bloqueios, perda de acesso ao número ou
            qualquer dano decorrente do uso dessa modalidade de conexão</strong> — a loja usa por
            sua conta e risco.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm font-medium text-amber-900">
            <input
              type="checkbox"
              checked={riskChecked}
              onChange={(event) => setRiskChecked(event.target.checked)}
              className="mt-0.5"
            />
            Li e aceito os riscos acima.
          </label>
        </div>
      )}

      {qrCodeDataUrl && !expired && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCodeDataUrl} alt="QR Code para conectar o WhatsApp" className="h-56 w-56" />
          <p className="text-sm text-zinc-500">
            Abra o WhatsApp no celular da loja → Aparelhos conectados → Conectar um aparelho, e
            escaneie o código acima.
          </p>
        </div>
      )}

      {expired && (
        <p className="text-sm text-amber-700">
          O QR Code expirou antes de ser escaneado. Gere um novo código pra tentar de novo.
        </p>
      )}

      <button
        type="button"
        disabled={pending || (!hasAcceptedRisk && !riskChecked)}
        onClick={handleConnect}
        className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending
          ? "Gerando QR Code..."
          : qrCodeDataUrl && !expired
            ? "Gerar novo código"
            : expired
              ? "Gerar novo código"
              : "Conectar via QR Code"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
