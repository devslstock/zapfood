import "server-only";
import { isEvolutionConfigured, sendEvolutionTextMessage } from "@/lib/evolution/client";

type StoreWhatsAppConfig = {
  whatsappProvider?: string | null;
  whatsappToken?: string | null;
  whatsappPhoneNumberId?: string | null;
  evolutionInstanceName?: string | null;
};

// Ponto único de envio de WhatsApp do app — despacha pra Meta Cloud API ou
// Evolution API conforme whatsappProvider da loja, sem que os pontos que já
// chamam essa função (webhook, updateOrderStatus, checkout) precisem saber
// qual das duas está em uso.
export async function sendWhatsAppMessage(
  store: StoreWhatsAppConfig,
  to: string,
  body: string
): Promise<void> {
  if (store.whatsappProvider === "EVOLUTION") {
    return sendViaEvolution(store, to, body);
  }
  return sendViaMeta(store, to, body);
}

// Sem credenciais reais nesta versão de demonstração: se a loja (ou o fallback
// global via env) não tiver token configurado, apenas loga em vez de falhar —
// mantém o caminho de código real/produção sem exigir a Cloud API da Meta
// para testar o resto do sistema.
async function sendViaMeta(store: StoreWhatsAppConfig, to: string, body: string): Promise<void> {
  const token = store.whatsappToken || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = store.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[whatsapp] (sem credenciais) mensagem para ${to}:\n${body}`);
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[whatsapp] falha ao enviar mensagem para ${to}: ${response.status} ${errorText}`
    );
  }
}

// Mesmo contrato do envio via Meta: nunca lança erro por "não configurado"
// (modo demo) nem por falha no envio (só loga) — os 3 call sites já tratam
// falhas inesperadas com seu próprio try/catch.
async function sendViaEvolution(store: StoreWhatsAppConfig, to: string, body: string): Promise<void> {
  if (!store.evolutionInstanceName || !isEvolutionConfigured()) {
    console.log(`[whatsapp/evolution] (sem instance/credenciais) mensagem para ${to}:\n${body}`);
    return;
  }

  try {
    await sendEvolutionTextMessage(store.evolutionInstanceName, to, body);
  } catch (error) {
    console.error(`[whatsapp/evolution] falha ao enviar mensagem para ${to}:`, error);
  }
}
