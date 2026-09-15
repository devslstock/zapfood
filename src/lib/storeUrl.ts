import "server-only";

// Sem ROOT_DOMAIN configurado, cada loja usa o link por caminho (/loja/slug).
// Assim que um domínio próprio for configurado (ROOT_DOMAIN=zaapfood.com +
// DNS coringa *.zaapfood.com), cada loja passa a ter seu próprio subdomínio —
// ver src/middleware.ts, que faz o rewrite de <slug>.zaapfood.com para /loja/<slug>.
export function getStoreMenuUrl(slug: string): string {
  const rootDomain = process.env.ROOT_DOMAIN;
  if (rootDomain) {
    return `https://${slug}.${rootDomain}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/loja/${slug}`;
}

// URL única e compartilhada por todas as lojas (o webhook identifica qual
// loja é pelo whatsappPhoneNumberId recebido no payload da Meta) — mostrada
// no passo a passo de configuração em Configurações → WhatsApp.
export function getWhatsappWebhookUrl(): string {
  const rootDomain = process.env.ROOT_DOMAIN;
  const base = rootDomain ? `https://${rootDomain}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/whatsapp/webhook`;
}

// URL de webhook individual por loja, cadastrada automaticamente na Evolution
// API ao criar a instance (diferente do webhook único da Meta acima) — o
// instanceName + token na query string são a única autenticação desse
// webhook (a Evolution não tem handshake de verificação nem assinatura HMAC
// como a Meta). Ver src/app/api/whatsapp/evolution-webhook/route.ts.
export function getEvolutionWebhookUrl(instanceName: string, token: string): string {
  const rootDomain = process.env.ROOT_DOMAIN;
  const base = rootDomain ? `https://${rootDomain}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/whatsapp/evolution-webhook?instance=${encodeURIComponent(instanceName)}&token=${encodeURIComponent(token)}`;
}
