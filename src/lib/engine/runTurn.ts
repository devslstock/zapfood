import "server-only";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { createOrder } from "@/lib/orders/createOrder";
import { loadCatalogSnapshot } from "@/lib/engine/catalogSnapshot";
import { step } from "@/lib/engine/fsm";
import { INITIAL_STATE, type ConversationStateData } from "@/lib/engine/types";

function serializeState(state: ConversationStateData) {
  return {
    step: state.step,
    cart: JSON.stringify(state.cart),
    pendingCategoryId: state.pendingCategoryId ?? null,
    pendingProductId: state.pendingProductId ?? null,
    deliveryType: state.deliveryType ?? null,
    address: state.address ?? null,
    paymentMethod: state.paymentMethod ?? null,
  };
}

function deserializeState(row: {
  step: string;
  cart: string;
  pendingCategoryId: string | null;
  pendingProductId: string | null;
  deliveryType: string | null;
  address: string | null;
  paymentMethod: string | null;
} | null): ConversationStateData {
  if (!row) return { ...INITIAL_STATE };
  return {
    step: row.step as ConversationStateData["step"],
    cart: JSON.parse(row.cart),
    pendingCategoryId: row.pendingCategoryId ?? undefined,
    pendingProductId: row.pendingProductId ?? undefined,
    deliveryType: (row.deliveryType as ConversationStateData["deliveryType"]) ?? undefined,
    address: row.address ?? undefined,
    paymentMethod: (row.paymentMethod as ConversationStateData["paymentMethod"]) ?? undefined,
  };
}

export type RunTurnResult = {
  messages: string[];
  orderId?: number;
};

export async function runTurn(
  storeId: string,
  phone: string,
  text: string,
  customerName?: string
): Promise<RunTurnResult> {
  const customer = await prisma.customer.upsert({
    where: { storeId_phone: { storeId, phone } },
    update: customerName ? { name: customerName } : {},
    create: { storeId, phone, name: customerName },
  });

  const stateRow = await prisma.conversationState.findUnique({
    where: { storeId_customerId: { storeId, customerId: customer.id } },
  });
  const currentState = deserializeState(stateRow);

  const catalog = await loadCatalogSnapshot(storeId);

  const result = step({ text, state: currentState, catalog });

  await prisma.conversationState.upsert({
    where: { storeId_customerId: { storeId, customerId: customer.id } },
    update: serializeState(result.state),
    create: { storeId, customerId: customer.id, ...serializeState(result.state) },
  });

  const messages = [...result.messages];
  let orderId: number | undefined;

  if (result.orderIntent) {
    const order = await createOrder(storeId, customer.id, result.orderIntent);
    orderId = order.id;
    messages.push(
      `Pedido #${order.id} confirmado! Total: ${formatCents(order.totalCents)}. Obrigado! 🎉`
    );
  }

  return { messages, orderId };
}
