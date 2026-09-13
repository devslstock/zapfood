import "server-only";
import { prisma } from "@/lib/prisma";
import { emitOrderChanged } from "@/lib/events/orderEvents";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/domain";

export class InvalidStatusTransitionError extends Error {}

// Mensagens de acompanhamento enviadas ao cliente pelo WhatsApp a cada
// mudança de status — mesmo texto usado pelo motor de conversa, para o
// cliente ter uma experiência única independente de como o pedido foi feito.
const STATUS_UPDATE_MESSAGES: Partial<Record<OrderStatus, (storeName: string) => string>> = {
  EM_PREPARO: (storeName) => `Seu pedido na ${storeName} entrou em preparo! 👨‍🍳`,
  PRONTO: (storeName) => `Seu pedido na ${storeName} está pronto! ✅`,
  EM_ENTREGA: (storeName) => `Seu pedido na ${storeName} saiu para entrega! 🛵`,
  CONCLUIDO: (storeName) => `Seu pedido na ${storeName} foi concluído. Obrigado pela preferência! 🎉`,
  CANCELADO: (storeName) => `Seu pedido na ${storeName} foi cancelado.`,
};

export async function updateOrderStatus(
  orderId: number,
  storeId: string,
  newStatus: OrderStatus,
  changedByStaffId: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { customer: true, store: true },
  });
  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  const allowed = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new InvalidStatusTransitionError(
      `Não é possível mudar de "${order.status}" para "${newStatus}".`
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      statusHistory: { create: [{ status: newStatus, changedByStaffId }] },
    },
  });

  emitOrderChanged(storeId);

  const buildMessage = STATUS_UPDATE_MESSAGES[newStatus];
  if (buildMessage) {
    try {
      await sendWhatsAppMessage(
        order.store,
        order.customer.phone,
        `${buildMessage(order.store.name)}\n\nStatus: ${ORDER_STATUS_LABELS[newStatus]} · Pedido #${order.id}`
      );
    } catch (error) {
      console.error("[updateOrderStatus] falha ao enviar atualização pelo WhatsApp", error);
    }
  }

  return updated;
}
