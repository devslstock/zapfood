import "server-only";
import { prisma } from "@/lib/prisma";
import { emitOrderChanged } from "@/lib/events/orderEvents";
import { resolveDeliveryFeeCents } from "@/lib/deliveryZone";
import type { OrderIntent } from "@/lib/engine/types";

function lineOptionsTotalCents(line: OrderIntent["cart"][number]): number {
  return (line.options ?? []).reduce((sum, option) => sum + option.priceCents, 0);
}

export async function createOrder(storeId: string, customerId: string, intent: OrderIntent) {
  const subtotalCents = intent.cart.reduce(
    (sum, line) => sum + (line.unitPriceCents + lineOptionsTotalCents(line)) * line.quantity,
    0
  );

  // Taxa sempre recalculada a partir do catálogo de bairros da loja — nunca
  // aceita um valor vindo do cliente (digital menu ou motor de WhatsApp).
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: storeId },
    select: { deliveryFeeCents: true, deliveryZones: { select: { neighborhood: true, feeCents: true } } },
  });
  const deliveryFeeCents =
    intent.deliveryType === "ENTREGA"
      ? resolveDeliveryFeeCents(intent.neighborhood, store.deliveryZones, store.deliveryFeeCents)
      : 0;

  const order = await prisma.order.create({
    data: {
      storeId,
      customerId,
      status: "RECEBIDO",
      deliveryType: intent.deliveryType,
      address: intent.address,
      addressLat: intent.addressLat,
      addressLng: intent.addressLng,
      paymentMethod: intent.paymentMethod,
      subtotalCents,
      deliveryFeeCents,
      totalCents: subtotalCents + deliveryFeeCents,
      items: {
        create: intent.cart.map((line) => ({
          productId: line.productId,
          productNameSnapshot: line.name,
          unitPriceCentsSnapshot: line.unitPriceCents,
          quantity: line.quantity,
          optionsTotalCentsSnapshot: lineOptionsTotalCents(line),
          optionsSnapshot: line.options?.length ? JSON.stringify(line.options) : undefined,
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
