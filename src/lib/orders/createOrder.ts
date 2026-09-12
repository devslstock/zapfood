import "server-only";
import { prisma } from "@/lib/prisma";
import { emitOrderChanged } from "@/lib/events/orderEvents";
import type { OrderIntent } from "@/lib/engine/types";

export async function createOrder(storeId: string, customerId: string, intent: OrderIntent) {
  const subtotalCents = intent.cart.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      storeId,
      customerId,
      status: "RECEBIDO",
      deliveryType: intent.deliveryType,
      address: intent.address,
      paymentMethod: intent.paymentMethod,
      subtotalCents,
      totalCents: subtotalCents,
      items: {
        create: intent.cart.map((line) => ({
          productId: line.productId,
          productNameSnapshot: line.name,
          unitPriceCentsSnapshot: line.unitPriceCents,
          quantity: line.quantity,
        })),
      },
      statusHistory: {
        create: [{ status: "RECEBIDO" }],
      },
    },
  });

  emitOrderChanged(storeId);

  return order;
}
