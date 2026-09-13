import { requireSession, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const session = await requireSession();
  requirePermission(session, "customers");

  const customers = await prisma.customer.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: "desc" },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Quem já pediu na sua loja pelo cardápio digital ou WhatsApp.
        </p>
      </div>

      {customers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Nenhum cliente registrado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 font-medium">Endereços salvos</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {customer.name || <span className="text-zinc-400">Sem nome</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{customer.phone}</td>
                  <td className="px-4 py-3 text-zinc-600">{customer._count.orders}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        customer.pinHash
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {customer.pinHash ? "Com conta" : "Convidado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {customer.addresses.length === 0 ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {customer.addresses.map((address) => (
                          <li key={address.id} className="text-xs">
                            {address.address}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
