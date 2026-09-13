"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/money";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  KANBAN_COLUMNS,
  PAYMENT_METHOD_LABELS,
  type DeliveryType,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/domain";
import { updateOrderStatusFormAction } from "@/app/admin/(protected)/orders/actions";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { PrintModalButton } from "@/components/admin/PrintModalButton";

export type OrderViewItem = {
  id: number;
  status: string;
  deliveryType: string;
  paymentMethod: string;
  address: string | null;
  addressLat: number | null;
  addressLng: number | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  createdAt: Date;
  customer: { name: string | null; phone: string };
  items: {
    productNameSnapshot: string;
    quantity: number;
    unitPriceCentsSnapshot: number;
    optionsTotalCentsSnapshot: number;
    optionsSnapshot: string | null;
  }[];
  statusHistory: { id: string; status: string; changedAt: Date; changedByStaff: { name: string } | null }[];
};

const LIST_FILTERS: { label: string; statuses: OrderStatus[] }[] = [
  { label: "Novo", statuses: ["RECEBIDO"] },
  { label: "Em Preparo", statuses: ["EM_PREPARO"] },
  { label: "Sair para Entrega", statuses: ["PRONTO", "EM_ENTREGA"] },
  { label: "Entregue", statuses: ["CONCLUIDO"] },
];

function parseOptionsLabel(optionsSnapshot: string | null): string | null {
  if (!optionsSnapshot) return null;
  try {
    const options = JSON.parse(optionsSnapshot) as { name: string }[];
    return options.map((option) => option.name).join(", ");
  } catch {
    return null;
  }
}

function matchesSearch(order: OrderViewItem, query: string): boolean {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return (
    String(order.id).includes(needle) ||
    (order.customer.name?.toLowerCase().includes(needle) ?? false) ||
    order.customer.phone.includes(needle)
  );
}

function OrderDetailPanel({
  order,
  onBack,
  variant = "inline",
}: {
  order: OrderViewItem;
  onBack: () => void;
  variant?: "inline" | "modal";
}) {
  const status = order.status as OrderStatus;
  const nextStatuses = ORDER_STATUS_TRANSITIONS[status] ?? [];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
      <button
        type="button"
        onClick={onBack}
        className={`mb-3 text-sm font-medium text-zinc-500 hover:underline ${
          variant === "inline" ? "lg:hidden" : ""
        }`}
      >
        {variant === "modal" ? "✕ Fechar" : "← Voltar à lista"}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Pedido #{order.id}</h2>
          <span className="mt-1 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
            {ORDER_STATUS_LABELS[status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
            <dd className="font-medium text-zinc-900">
              {order.address}
              {order.addressLat != null && order.addressLng != null && (
                <>
                  {" · "}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${order.addressLat}&mlon=${order.addressLng}#map=17/${order.addressLat}/${order.addressLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-dark hover:underline"
                  >
                    Ver no mapa
                  </a>
                </>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-zinc-500">Pagamento</dt>
          <dd className="font-medium text-zinc-900">
            {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Subtotal</dt>
          <dd className="font-medium text-zinc-900">{formatCents(order.subtotalCents)}</dd>
        </div>
        {order.deliveryFeeCents > 0 && (
          <div>
            <dt className="text-zinc-500">Taxa de entrega</dt>
            <dd className="font-medium text-zinc-900">{formatCents(order.deliveryFeeCents)}</dd>
          </div>
        )}
        <div>
          <dt className="text-zinc-500">Total do pedido</dt>
          <dd className="font-semibold text-zinc-900">{formatCents(order.totalCents)}</dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-zinc-700">Itens</h3>
      <ul className="mt-2 divide-y divide-zinc-100 text-sm">
        {order.items.map((item, index) => {
          const optionsLabel = parseOptionsLabel(item.optionsSnapshot);
          return (
            <li key={index} className="flex justify-between py-2">
              <span>
                {item.quantity}x {item.productNameSnapshot}
                {optionsLabel && <span className="block pl-3 text-xs text-zinc-400">{optionsLabel}</span>}
              </span>
              <span className="text-zinc-500">
                {formatCents(
                  (item.unitPriceCentsSnapshot + item.optionsTotalCentsSnapshot) * item.quantity
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-6 text-sm font-semibold text-zinc-700">Histórico</h3>
      <ul className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
        {order.statusHistory.map((event) => (
          <li key={event.id}>
            {event.changedAt.toLocaleString("pt-BR")} — {ORDER_STATUS_LABELS[event.status as OrderStatus]}
            {event.changedByStaff ? ` (${event.changedByStaff.name})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrdersView({ orders }: { orders: OrderViewItem[] }) {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(
    orders.find((o) => o.status !== "CANCELADO")?.id ?? null
  );
  // No mobile, a lista pré-seleciona o primeiro pedido (bom pro desktop, que
  // mostra lista+detalhe lado a lado) mas isso não deve abrir o detalhe em
  // tela cheia sem o usuário tocar em nada — controla essa visibilidade
  // separado da seleção em si.
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  // Pedido aberto a partir de um clique no card do Kanban — mostrado como
  // modal, sem sair da tela do quadro (antes navegava pra uma página cheia).
  const [kanbanModalOrderId, setKanbanModalOrderId] = useState<number | null>(null);

  const active = orders.filter((o) => o.status !== "CANCELADO");
  const cancelled = orders.filter((o) => o.status === "CANCELADO");

  const filteredForList = useMemo(() => {
    return active
      .filter((order) => matchesSearch(order, search))
      .filter((order) => {
        if (!statusFilter) return true;
        const filter = LIST_FILTERS.find((f) => f.label === statusFilter);
        return filter ? filter.statuses.includes(order.status as OrderStatus) : true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [active, search, statusFilter]);

  const filteredForKanban = useMemo(
    () => active.filter((order) => matchesSearch(order, search)),
    [active, search]
  );

  const kanbanColumns = KANBAN_COLUMNS.map((status) => ({
    status,
    orders: filteredForKanban.filter((order) => order.status === status),
  }));

  const selectedOrder = filteredForList.find((o) => o.id === selectedId) ?? filteredForList[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              view === "list" ? "bg-brand text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              view === "kanban" ? "bg-brand text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Kanban
          </button>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar pedido (nº, nome ou telefone)"
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {view === "list" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === null ? "bg-brand text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Todos
            </button>
            {LIST_FILTERS.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setStatusFilter(filter.label)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  statusFilter === filter.label
                    ? "bg-brand text-white"
                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div
              className={`max-h-[70vh] flex-col gap-2 overflow-y-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-100 lg:flex ${
                mobileDetailOpen ? "hidden" : "flex"
              }`}
            >
              {filteredForList.length === 0 && (
                <p className="p-4 text-center text-sm text-zinc-400">Nenhum pedido encontrado.</p>
              )}
              {filteredForList.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(order.id);
                    setMobileDetailOpen(true);
                  }}
                  className={`flex flex-col gap-0.5 rounded-xl p-3 text-left text-sm transition ${
                    selectedOrder?.id === order.id ? "bg-brand/10 ring-1 ring-brand" : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">#{order.id}</span>
                    <span className="text-xs text-zinc-400">
                      {order.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="text-zinc-600">{order.customer.name || order.customer.phone}</span>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                    </span>
                    <span className="font-medium text-zinc-900">{formatCents(order.totalCents)}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedOrder ? (
              <div className={mobileDetailOpen ? "" : "hidden lg:block"}>
                <OrderDetailPanel order={selectedOrder} onBack={() => setMobileDetailOpen(false)} />
              </div>
            ) : (
              <div className="hidden items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-10 text-sm text-zinc-400 lg:flex">
                Selecione um pedido para ver os detalhes.
              </div>
            )}
          </div>
        </>
      ) : (
        <KanbanBoard columns={kanbanColumns} onOpenOrder={setKanbanModalOrderId} />
      )}

      {kanbanModalOrderId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            {(() => {
              const modalOrder = orders.find((o) => o.id === kanbanModalOrderId);
              return modalOrder ? (
                <OrderDetailPanel
                  order={modalOrder}
                  variant="modal"
                  onBack={() => setKanbanModalOrderId(null)}
                />
              ) : null;
            })()}
          </div>
        </div>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500">Cancelados ({cancelled.length})</h2>
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
