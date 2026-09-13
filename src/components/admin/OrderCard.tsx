"use client";

import { formatCents } from "@/lib/money";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
  type DeliveryType,
} from "@/lib/domain";
import { updateOrderStatusFormAction } from "@/app/admin/(protected)/orders/actions";
import { PrintModalButton } from "@/components/admin/PrintModalButton";

export type OrderCardData = {
  id: number;
  status: string;
  deliveryType: string;
  totalCents: number;
  createdAt: Date;
  customer: { name: string | null; phone: string };
  items: { productNameSnapshot: string; quantity: number; optionsSnapshot: string | null }[];
};

function parseOptionsLabel(optionsSnapshot: string | null): string | null {
  if (!optionsSnapshot) return null;
  try {
    const options = JSON.parse(optionsSnapshot) as { name: string }[];
    return options.map((option) => option.name).join(", ");
  } catch {
    return null;
  }
}

export function OrderCard({
  order,
  onOpenDetail,
}: {
  order: OrderCardData;
  onOpenDetail: (orderId: number) => void;
}) {
  const status = order.status as OrderStatus;
  const nextStatuses = ORDER_STATUS_TRANSITIONS[status] ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(order.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpenDetail(order.id);
      }}
      className="cursor-pointer rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 hover:ring-brand"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-900">Pedido #{order.id}</span>
        <span className="text-xs text-zinc-400">
          {order.createdAt.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-600">{order.customer.name || order.customer.phone}</p>
      <ul className="mt-2 space-y-0.5 text-xs text-zinc-500">
        {order.items.map((item, index) => {
          const optionsLabel = parseOptionsLabel(item.optionsSnapshot);
          return (
            <li key={index}>
              <span>
                {item.quantity}x {item.productNameSnapshot}
              </span>
              {optionsLabel && <span className="block pl-3 text-zinc-400">{optionsLabel}</span>}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-900">{formatCents(order.totalCents)}</span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {DELIVERY_TYPE_LABELS[order.deliveryType as DeliveryType]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
        {nextStatuses.map((next) => (
          <form key={next} action={updateOrderStatusFormAction.bind(null, order.id, next)}>
            <button
              type="submit"
              className={
                next === "CANCELADO"
                  ? "rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  : "rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-dark hover:bg-brand/20"
              }
            >
              {ORDER_STATUS_LABELS[next]}
            </button>
          </form>
        ))}
        <PrintModalButton
          url={`/print/orders/${order.id}`}
          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        />
      </div>
    </div>
  );
}
