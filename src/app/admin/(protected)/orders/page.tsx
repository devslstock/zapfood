import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { KANBAN_COLUMNS, ORDER_STATUS_LABELS } from "@/lib/domain";
import { OrderCard } from "@/components/admin/OrderCard";

export default async function OrdersPage() {
  const session = await requireSession();

  const orders = await prisma.order.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: "asc" },
    include: { customer: true, items: true },
  });

  const cancelled = orders.filter((order) => order.status === "CANCELADO");

  const columns = KANBAN_COLUMNS.map((status) => ({
    status,
    orders: orders.filter((order) => order.status === status),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Este painel se atualiza automaticamente quando chegam novos pedidos.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.status} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">
                {ORDER_STATUS_LABELS[column.status]}
              </h2>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {column.orders.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {column.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {column.orders.length === 0 && (
                <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                  Nenhum pedido
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {cancelled.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500">
            Cancelados ({cancelled.length})
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {cancelled.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-500"
              >
                Pedido #{order.id} — {order.customer.name || order.customer.phone} —{" "}
                {formatCents(order.totalCents)}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
