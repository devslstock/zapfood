import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

export default async function AdminDashboardPage() {
  const session = await requireSession();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [ordersToday, revenueToday, pendingCount, categoryCount] = await Promise.all([
    prisma.order.count({
      where: { storeId: session.storeId, createdAt: { gte: startOfToday } },
    }),
    prisma.order.aggregate({
      where: {
        storeId: session.storeId,
        createdAt: { gte: startOfToday },
        status: { not: "CANCELADO" },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.count({
      where: {
        storeId: session.storeId,
        status: { in: ["RECEBIDO", "EM_PREPARO", "PRONTO", "EM_ENTREGA"] },
      },
    }),
    prisma.category.count({ where: { storeId: session.storeId } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Olá, {session.staffName} 👋</h1>
        <p className="mt-1 text-sm text-zinc-500">Resumo de hoje da {session.storeName}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
          <p className="text-sm text-zinc-500">Pedidos hoje</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{ordersToday}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
          <p className="text-sm text-zinc-500">Faturamento hoje</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {formatCents(revenueToday._sum.totalCents ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
          <p className="text-sm text-zinc-500">Pedidos em andamento</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{pendingCount}</p>
        </div>
      </div>

      {categoryCount === 0 && (
        <div className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-6">
          <p className="font-semibold text-zinc-900">Seu cardápio está vazio</p>
          <p className="mt-1 text-sm text-zinc-600">
            Cadastre categorias e produtos para começar a receber pedidos pelo WhatsApp.
          </p>
          <Link
            href="/admin/catalog"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Configurar cardápio
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/orders"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md"
        >
          <p className="font-semibold text-zinc-900">Ver pedidos</p>
          <p className="mt-1 text-sm text-zinc-500">
            Acompanhe o quadro de pedidos e imprima comandas para a cozinha.
          </p>
        </Link>
        <Link
          href="/admin/simulator"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-md"
        >
          <p className="font-semibold text-zinc-900">Testar o WhatsApp</p>
          <p className="mt-1 text-sm text-zinc-500">
            Simule uma conversa de cliente sem precisar de credenciais reais.
          </p>
        </Link>
      </div>
    </div>
  );
}
