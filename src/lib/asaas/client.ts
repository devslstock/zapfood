import "server-only";

// Integração com a API do Asaas (asaas.com) para cobrança recorrente
// (cartão/PIX) das lojas que assinam a plataforma. Usamos o Checkout
// hospedado do Asaas — o dono da loja é redirecionado para uma página segura
// do próprio Asaas para cadastrar o cartão ou pagar via PIX, então o ZaapFood
// nunca recebe nem armazena dado de cartão. Ver docs.asaas.com/reference.
const BASE_URL = process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3";

// Assinaturas criadas no cadastro público começam com este número de dias
// grátis antes da 1ª cobrança (loja fica ativa e usável durante o período).
export const TRIAL_DAYS = 7;

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error("ASAAS_API_KEY não está configurado.");
  }
  return key;
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "ZaapFood/1.0",
      access_token: apiKey(),
      ...(init?.headers ?? {}),
    },
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      json?.errors?.[0]?.description || json?.message || `Erro ${response.status} na API do Asaas.`;
    throw new Error(message);
  }
  return json as T;
}

export async function createAsaasCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
}): Promise<{ id: string }> {
  return asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      email: input.email,
    }),
  });
}

// O Checkout hospedado do Asaas só aceita CREDIT_CARD para assinaturas
// (chargeTypes: RECURRENT rejeita PIX — testado no sandbox). Para oferecer
// cartão E PIX sem o ZaapFood tocar em dado de cartão, criamos a assinatura
// direto com billingType UNDEFINED: o Asaas gera a 1ª cobrança já com uma
// invoiceUrl hospedada (fatura) onde o cliente escolhe como paga.
export async function createAsaasSubscriptionWithInvoice(input: {
  customerId: string;
  storeId: string;
  valueCents: number;
  nextDueDate: string; // YYYY-MM-DD
}): Promise<{ subscriptionId: string; invoiceUrl: string }> {
  const subscription = await asaasFetch<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: input.valueCents / 100,
      nextDueDate: input.nextDueDate,
      cycle: "MONTHLY",
      description: "Assinatura ZaapFood",
      externalReference: input.storeId,
    }),
  });

  const payments = await asaasFetch<{ data: { invoiceUrl: string }[] }>(
    `/payments?subscription=${subscription.id}&limit=1`
  );
  const invoiceUrl = payments.data[0]?.invoiceUrl;
  if (!invoiceUrl) {
    throw new Error("Assinatura criada, mas não encontramos o link de pagamento.");
  }

  return { subscriptionId: subscription.id, invoiceUrl };
}

// Cobrança mais recente de uma assinatura já existente — usado quando o
// dono clica em "atualizar forma de pagamento" em Configurações, pra
// reaproveitar a fatura em aberto em vez de criar uma assinatura duplicada.
export async function getLatestInvoiceUrl(subscriptionId: string): Promise<string | null> {
  const payments = await asaasFetch<{ data: { invoiceUrl: string }[] }>(
    `/payments?subscription=${subscriptionId}&limit=1`
  );
  return payments.data[0]?.invoiceUrl ?? null;
}

// Link do painel do Asaas para o super-admin conferir/gerenciar a assinatura
// de uma loja manualmente, se precisar.
export function getAsaasDashboardCustomerUrl(customerId: string): string {
  const isSandbox = BASE_URL.includes("sandbox");
  const host = isSandbox ? "sandbox.asaas.com" : "www.asaas.com";
  return `https://${host}/customerAccountDetail/${customerId}`;
}
