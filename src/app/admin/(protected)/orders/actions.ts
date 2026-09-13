"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requirePermission } from "@/lib/auth/guards";
import {
  updateOrderStatus,
  InvalidStatusTransitionError,
} from "@/lib/orders/updateOrderStatus";
import type { OrderStatus } from "@/lib/domain";

export async function updateOrderStatusAction(
  orderId: number,
  newStatus: OrderStatus
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  requirePermission(session, "orders");
  try {
    await updateOrderStatus(orderId, session.storeId, newStatus, session.staffId);
  } catch (error) {
    if (error instanceof InvalidStatusTransitionError) {
      return { ok: false };
    }
    throw error;
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

// Mesma ação, mas com retorno `void` — para uso direto em `<form action={...}>`
// (os botões de status), que não podem receber uma action retornando valor.
export async function updateOrderStatusFormAction(
  orderId: number,
  newStatus: OrderStatus
): Promise<void> {
  await updateOrderStatusAction(orderId, newStatus);
}
