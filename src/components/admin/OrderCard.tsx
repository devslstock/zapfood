import Link from "next/link";
import { formatCents } from "@/lib/money";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
  type DeliveryType,
} from "@/lib/domain";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/actions";

type OrderCardData = {
  id: number;
  status: string;
  deliveryType: string;
  totalCents: number;
  createdAt: Date;
  customer: { name: string | null; phone: string };
  items: { productNameSnapshot: string; quantity: number }[];
};

export function OrderCard({ order }: { order: OrderCardData }) {
  const status = order.status as OrderStatus;
  const nextStatuses = ORDER_STATUS_TRANSITIONS[status] ?? [];

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-semibold text-zinc-900 hover:underline"
        >
          Pedido #{order.id}
        </Link>
        <span className="text-xs text-zinc-400">
          {order.createdAt.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-600">{order.customer.name || order.customer.phone}</p>
      <ul className="mt-2 space-y-0.5 text-xs text-zinc-500">
        {order.items.map((item, index) => (
          <li key={index}>
            {item.quantity}x {item.productNameSnapshot}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-900">{formatCents(order.totalCents)}</span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {DELIVERY_TYPE_LABELS[order.deliveryType as DeliveryType]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {nextStatuses.map((next) => (
          <form key={next} action={updateOrderStatusAction.bind(null, order.id, next)}>
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
        <Link
          href={`/print/orders/${order.id}`}
          target="_blank"
          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Imprimir
        </Link>
      </div>
    </div>
  );
}
