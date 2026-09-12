import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  type DeliveryType,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/domain";
import { updateOrderStatusAction } from "../actions";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  const session = await requireSession();

  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, storeId: session.storeId },
        include: {
          customer: true,
          items: true,
          statusHistory: { orderBy: { changedAt: "asc" }, include: { changedByStaff: true } },
        },
      })
    : null;

  if (!order) notFound();

  const status = order.status as OrderStatus;
  const nextStatuses = ORDER_STATUS_TRANSITIONS[status] ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-zinc-500 hover:underline">
            ← Voltar para pedidos
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">Pedido #{order.id}</h1>
        </div>
        <Link
          href={`/print/orders/${order.id}`}
          target="_blank"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Imprimir comanda
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand-dark">
            {ORDER_STATUS_LABELS[status]}
          </span>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500">Cliente</dt>
            <dd className="font-medium text-zinc-900">
              {order.customer.name || "Sem nome"} ({order.customer.phone})
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Entrega</dt>
            <dd className="font-medium text-zinc-900">
              {DELIVERY_TYPE_LABELS[order.deliveryType as DeliveryType]}
            </dd>
          </div>
          {order.address && (
            <div className="col-span-2">
              <dt className="text-zinc-500">Endereço</dt>
              <dd className="font-medium text-zinc-900">{order.address}</dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-500">Pagamento</dt>
            <dd className="font-medium text-zinc-900">
              {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Total</dt>
            <dd className="font-semibold text-zinc-900">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>

        <h2 className="mt-6 text-sm font-semibold text-zinc-700">Itens</h2>
        <ul className="mt-2 divide-y divide-zinc-100 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.quantity}x {item.productNameSnapshot}
              </span>
              <span className="text-zinc-500">
                {formatCents(item.unitPriceCentsSnapshot * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-zinc-700">Histórico</h2>
        <ul className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
          {order.statusHistory.map((event) => (
            <li key={event.id}>
              {event.changedAt.toLocaleString("pt-BR")} — {ORDER_STATUS_LABELS[event.status as OrderStatus]}
              {event.changedByStaff ? ` (${event.changedByStaff.name})` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
