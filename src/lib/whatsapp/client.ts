import "server-only";

type StoreWhatsAppConfig = {
  whatsappToken?: string | null;
  whatsappPhoneNumberId?: string | null;
};

// Sem credenciais reais nesta versão de demonstração: se a loja (ou o fallback
// global via env) não tiver token configurado, apenas loga em vez de falhar —
// mantém o caminho de código real/produção sem exigir a Cloud API da Meta
// para testar o resto do sistema.
export async function sendWhatsAppMessage(
  store: StoreWhatsAppConfig,
  to: string,
  body: string
): Promise<void> {
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
