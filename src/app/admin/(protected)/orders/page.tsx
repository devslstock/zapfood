import { requireSession, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OrdersView } from "@/components/admin/OrdersView";

export default async function OrdersPage() {
  const session = await requireSession();
  requirePermission(session, "orders");

  const orders = await prisma.order.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: "asc" },
    include: {
      customer: true,
      items: true,
      statusHistory: { orderBy: { changedAt: "asc" }, include: { changedByStaff: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Veja em lista com detalhe ao lado, ou arraste os cards no Kanban pra mudar o status.
        </p>
      </div>

      <OrdersView orders={orders} />
    </div>
  );
}
