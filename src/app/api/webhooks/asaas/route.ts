import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Recebe eventos de cobrança do Asaas e atualiza active/paymentStatus da
// loja sozinho — substitui o botão manual de ativar/desativar por
// inadimplência do super-admin. Cadastre esta URL em Asaas > Integrações >
// Webhooks, com o mesmo valor de ASAAS_WEBHOOK_SECRET no campo "Token de autenticação".
// Docs: https://docs.asaas.com/docs/webhook-para-cobrancas
const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RESTORED"]);
const OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);

type AsaasWebhookPayload = {
  event?: string;
  payment?: {
    customer?: string;
    subscription?: string;
  };
};

export async function POST(request: NextRequest) {
  const expectedToken = process.env.ASAAS_WEBHOOK_SECRET;
  const receivedToken = request.headers.get("asaas-access-token");
  if (!expectedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AsaasWebhookPayload | null;
  const event = body?.event;
  const customerId = body?.payment?.customer;
  const subscriptionId = body?.payment?.subscription;

  if (!event || !customerId) {
    return NextResponse.json({ ok: true });
  }

  const store = await prisma.store.findFirst({ where: { asaasCustomerId: customerId } });
  if (!store) {
    console.warn(`[asaas webhook] nenhuma loja encontrada para o customer ${customerId}`);
    return NextResponse.json({ ok: true });
  }

  if (subscriptionId && store.asaasSubscriptionId !== subscriptionId) {
    await prisma.store.update({ where: { id: store.id }, data: { asaasSubscriptionId: subscriptionId } });
  }

  if (PAID_EVENTS.has(event)) {
    await prisma.store.update({
      where: { id: store.id },
      data: { paymentStatus: "EM_DIA", active: true, deactivatedAt: null },
    });
  } else if (OVERDUE_EVENTS.has(event)) {
    await prisma.store.update({
      where: { id: store.id },
      data: { paymentStatus: "INADIMPLENTE", active: false, deactivatedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
