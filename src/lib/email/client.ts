import "server-only";

// Mesmo padrão do cliente do WhatsApp (src/lib/whatsapp/client.ts): sem
// RESEND_API_KEY configurada, só loga no servidor em vez de falhar — dá pra
// testar o fluxo de confirmação de e-mail de ponta a ponta sem depender de
// um provedor real.
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "ZaapFood <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email] (sem provedor configurado) para ${to} — assunto: "${subject}"\n${html}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[email] falha ao enviar para ${to}: ${response.status} ${errorText}`);
  }
}
