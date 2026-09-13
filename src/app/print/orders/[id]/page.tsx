import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { buildPixPayload } from "@/lib/pix";
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

  const [order, store] = await Promise.all([
    orderId
      ? prisma.order.findFirst({
          where: { id: orderId, storeId: session.storeId },
          include: { customer: true, items: true },
        })
      : null,
    prisma.store.findUniqueOrThrow({
      where: { id: session.storeId },
      select: { name: true, addressCity: true, pixKey: true },
    }),
  ]);

  if (!order) notFound();

  // QR gerado só quando a loja já configurou a chave PIX em Configurações e
  // o pagamento do pedido é PIX — sem isso não faz sentido cobrar por QR.
  let pixQrDataUrl: string | null = null;
  if (order.paymentMethod === "PIX" && store.pixKey && store.addressCity) {
    const payload = buildPixPayload({
      pixKey: store.pixKey,
      merchantName: store.name,
      merchantCity: store.addressCity,
      amountCents: order.totalCents,
      txid: `PEDIDO${order.id}`,
    });
    pixQrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 220 });
  }

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
        {order.items.map((item) => {
          let optionsLabel: string | null = null;
          if (item.optionsSnapshot) {
            try {
              const options = JSON.parse(item.optionsSnapshot) as { name: string }[];
              optionsLabel = options.map((option) => option.name).join(", ");
            } catch {
              optionsLabel = null;
            }
          }
          return (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.productNameSnapshot}
                {optionsLabel && <span className="block text-xs text-zinc-500">{optionsLabel}</span>}
              </span>
              <span>
                {formatCents(
                  (item.unitPriceCentsSnapshot + item.optionsTotalCentsSnapshot) * item.quantity
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <hr className="my-3 border-dashed border-zinc-300" />

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCents(order.subtotalCents)}</span>
      </div>
      {order.deliveryFeeCents > 0 && (
        <div className="flex justify-between">
          <span>Taxa de entrega</span>
          <span>{formatCents(order.deliveryFeeCents)}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between font-bold">
        <span>Total</span>
        <span>{formatCents(order.totalCents)}</span>
      </div>

      {order.notes && (
        <>
          <hr className="my-3 border-dashed border-zinc-300" />
          <p>Obs: {order.notes}</p>
        </>
      )}

      {pixQrDataUrl && (
        <>
          <hr className="my-3 border-dashed border-zinc-300" />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-bold">Pague com PIX</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pixQrDataUrl} alt="QR code PIX" className="h-40 w-40" />
            <p className="text-xs text-zinc-500">Escaneie no app do seu banco — valor já preenchido.</p>
          </div>
        </>
      )}

      <PrintButton />
    </div>
  );
}
