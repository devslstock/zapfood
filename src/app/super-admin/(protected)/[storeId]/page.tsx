import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, ROLE_LABELS } from "@/lib/domain";
import { getStoreMenuUrl } from "@/lib/storeUrl";
import { updateFinancialAction, updateCompanyInfoAction } from "./actions";
import { ToggleActiveButton } from "./ToggleActiveButton";
import { ResetPasswordButton } from "./ResetPasswordButton";

export default async function PlatformStoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      staff: { orderBy: { createdAt: "asc" } },
      _count: { select: { orders: true } },
    },
  });

  if (!store) notFound();

  const owner = store.staff.find((member) => member.role === "OWNER");
  const boundUpdateFinancial = updateFinancialAction.bind(null, store.id);
  const boundUpdateCompany = updateCompanyInfoAction.bind(null, store.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/super-admin" className="text-sm text-zinc-500 hover:underline">
          ← Lojas clientes
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{store.name}</h1>
            <p className="text-sm text-zinc-500">
              {store._count.orders} pedido(s) · criada em{" "}
              {store.createdAt.toLocaleDateString("pt-BR")}
            </p>
            <a
              href={getStoreMenuUrl(store.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              {getStoreMenuUrl(store.slug)}
            </a>
          </div>
          <ToggleActiveButton storeId={store.id} active={store.active} />
        </div>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Dono(a) e acesso</h2>
        {owner ? (
          <div className="mt-3 text-sm text-zinc-600">
            <p>
              <span className="font-medium text-zinc-900">{owner.name}</span> · {owner.email}
            </p>
            <p className="mt-1">
              E-mail {owner.emailVerifiedAt ? "confirmado" : "ainda não confirmado"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Nenhum(a) dono(a) cadastrado(a).</p>
        )}
        <div className="mt-4">
          <ResetPasswordButton storeId={store.id} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Financeiro</h2>
        <form action={boundUpdateFinancial} className="mt-4 flex flex-col gap-4 sm:max-w-md">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Situação</label>
            <select
              name="paymentStatus"
              defaultValue={store.paymentStatus}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Mensalidade (R$)
            </label>
            <input
              name="planMonthlyReais"
              type="number"
              min={0}
              step="0.01"
              defaultValue={store.planMonthlyCents ? store.planMonthlyCents / 100 : ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Observações internas
            </label>
            <textarea
              name="adminNotes"
              rows={3}
              defaultValue={store.adminNotes ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Dados cadastrais</h2>
        <form action={boundUpdateCompany} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">CPF ou CNPJ</label>
            <input
              name="cnpjCpf"
              defaultValue={store.cnpjCpf ?? ""}
              className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium text-zinc-700">Rua</label>
              <input
                name="addressStreet"
                defaultValue={store.addressStreet ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">Número</label>
              <input
                name="addressNumber"
                defaultValue={store.addressNumber ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-zinc-700">Complemento</label>
              <input
                name="addressComplement"
                defaultValue={store.addressComplement ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-zinc-700">Bairro</label>
              <input
                name="addressNeighborhood"
                defaultValue={store.addressNeighborhood ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-zinc-700">Cidade</label>
              <input
                name="addressCity"
                defaultValue={store.addressCity ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-zinc-700">UF</label>
              <input
                name="addressState"
                maxLength={2}
                defaultValue={store.addressState ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">CEP</label>
              <input
                name="addressZip"
                defaultValue={store.addressZip ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Equipe da loja</h2>
        <ul className="mt-4 divide-y divide-zinc-100 text-sm">
          {store.staff.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-zinc-900">{member.name}</p>
                <p className="text-zinc-500">{member.email}</p>
              </div>
              <span className="text-zinc-600">
                {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
