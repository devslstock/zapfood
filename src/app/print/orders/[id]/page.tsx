import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import {
  DELIVERY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type DeliveryType,
  type PaymentMethod,
} from "@/lib/domain";
import { PrintButton } from "../PrintButton";

export default async function PrintOrderPage({
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
        include: { customer: true, items: true },
      })
    : null;

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 font-mono text-sm shadow-sm print:rounded-none print:shadow-none">
      <div className="text-center">
        <p className="text-lg font-bold">{session.storeName}</p>
        <p className="text-xs text-zinc-500">Pedido #{order.id}</p>
        <p className="text-xs text-zinc-500">{order.createdAt.toLocaleString("pt-BR")}</p>
      </div>

      <hr className="my-3 border-dashed border-zinc-300" />

      <p>Cliente: {order.customer.name || "Sem nome"}</p>
      <p>Telefone: {order.customer.phone}</p>
      <p>Entrega: {DELIVERY_TYPE_LABELS[order.deliveryType as DeliveryType]}</p>
      {order.address && <p>Endereço: {order.address}</p>}
      <p>Pagamento: {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}</p>

      <hr className="my-3 border-dashed border-zinc-300" />

      <ul className="flex flex-col gap-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.quantity}x {item.productNameSnapshot}
            </span>
            <span>{formatCents(item.unitPriceCentsSnapshot * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <hr className="my-3 border-dashed border-zinc-300" />

      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{formatCents(order.totalCents)}</span>
      </div>

      {order.notes && (
        <>
          <hr className="my-3 border-dashed border-zinc-300" />
          <p>Obs: {order.notes}</p>
        </>
      )}

      <PrintButton />
    </div>
  );
}
