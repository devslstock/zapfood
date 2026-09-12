import "server-only";
import { prisma } from "@/lib/prisma";
import { emitOrderChanged } from "@/lib/events/orderEvents";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/domain";

export class InvalidStatusTransitionError extends Error {}

export async function updateOrderStatus(
  orderId: number,
  storeId: string,
  newStatus: OrderStatus,
  changedByStaffId: string
) {
  const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
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

  return updated;
}
