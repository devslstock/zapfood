"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/guards";
import {
  updateOrderStatus,
  InvalidStatusTransitionError,
} from "@/lib/orders/updateOrderStatus";
import type { OrderStatus } from "@/lib/domain";

export async function updateOrderStatusAction(orderId: number, newStatus: OrderStatus) {
  const session = await requireSession();
  try {
    await updateOrderStatus(orderId, session.storeId, newStatus, session.staffId);
  } catch (error) {
    if (error instanceof InvalidStatusTransitionError) {
      return;
    }
    throw error;
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
