import "server-only";

// Integração com um servidor self-hosted da Evolution API
// (evolutionfoundation.com.br) — gateway alternativo de WhatsApp via QR Code
// (protocolo WhatsApp Web/Baileys), usado pela opção "Conectar via QR Code"
// em Configurações. É infraestrutura da PLATAFORMA (uma chave global de
// servidor para todas as lojas, cada loja vira uma "instance" separada nesse
// servidor) — nunca roda na Vercel, precisa de um host à parte com processo
// sempre ativo. Ver EVOLUTION_API_URL/EVOLUTION_API_KEY no .env.example.
//
// IMPORTANTE: os formatos exatos de resposta abaixo seguem a documentação
// pública da Evolution API v2, mas essa API já teve divergências de formato
// entre versões — antes de usar em produção, confirme cada um contra uma
// instance real (ver seção "Verificação" do plano de implementação).

function baseUrl(): string {
  const url = process.env.EVOLUTION_API_URL;
  if (!url) {
    throw new Error("EVOLUTION_API_URL não está configurado.");
  }
  return url.replace(/\/$/, "");
}

function apiKey(): string {
  const key = process.env.EVOLUTION_API_KEY;
  if (!key) {
    throw new Error("EVOLUTION_API_KEY não está configurado.");
  }
  return key;
}

export function isEvolutionConfigured(): boolean {
  return !!process.env.EVOLUTION_API_URL && !!process.env.EVOLUTION_API_KEY;
}

async function evolutionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey(),
      ...(init?.headers ?? {}),
    },
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json?.message || json?.error?.message || `Erro ${response.status} na Evolution API.`;
    throw new Error(message);
  }
  return json as T;
}

export type EvolutionQrCode = { qrCodeDataUrl: string | null };

export async function createEvolutionInstance(
  instanceName: string,
  webhookUrl: string
): Promise<EvolutionQrCode> {
  const data = await evolutionFetch<{ qrcode?: { base64?: string } }>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        enabled: true,
        url: webhookUrl,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });
  return { qrCodeDataUrl: data.qrcode?.base64 ?? null };
}

export async function getEvolutionQrCode(instanceName: string): Promise<EvolutionQrCode> {
  const data = await evolutionFetch<{ base64?: string }>(
    `/instance/connect/${encodeURIComponent(instanceName)}`
  );
  return { qrCodeDataUrl: data.base64 ?? null };
}

export type EvolutionConnectionState = "open" | "close" | "connecting" | "unknown";

export async function getEvolutionConnectionState(
  instanceName: string
): Promise<EvolutionConnectionState> {
  const data = await evolutionFetch<{ instance?: { state?: string } }>(
    `/instance/connectionState/${encodeURIComponent(instanceName)}`
  );
  const state = data.instance?.state;
  if (state === "open" || state === "close" || state === "connecting") return state;
  return "unknown";
}

export async function sendEvolutionTextMessage(
  instanceName: string,
  to: string,
  body: string
): Promise<void> {
  await evolutionFetch(`/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: "POST",
    body: JSON.stringify({
      number: to,
      textMessage: { text: body },
    }),
  });
}

export async function deleteEvolutionInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/delete/${encodeURIComponent(instanceName)}`, {
    method: "DELETE",
  });
}
