"use client";

import { useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/domain";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/actions";
import { OrderCard, type OrderCardData } from "@/components/admin/OrderCard";

type Column = { status: OrderStatus; orders: OrderCardData[] };

function columnsSignature(columns: Column[]): string {
  return columns.map((c) => c.orders.map((o) => o.id).join(",")).join("|");
}

export function KanbanBoard({
  columns: initialColumns,
  onOpenOrder,
}: {
  columns: Column[];
  onOpenOrder: (orderId: number) => void;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [lastSignature, setLastSignature] = useState(() => columnsSignature(initialColumns));
  const [activeMobileStatus, setActiveMobileStatus] = useState<OrderStatus>(
    initialColumns[0]?.status ?? "RECEBIDO"
  );

  // Reflete no board local qualquer atualização vinda do servidor (novo
  // pedido chegando via SSE, ou o próprio router.refresh() depois de um
  // drag bem-sucedido) — ajusta o estado durante a própria renderização
  // (padrão recomendado pelo React pra "resetar estado quando as props
  // mudam"), em vez de um useEffect que geraria um re-render extra.
  const nextSignature = columnsSignature(initialColumns);
  if (nextSignature !== lastSignature) {
    setLastSignature(nextSignature);
    setColumns(initialColumns);
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const fromStatus = source.droppableId as OrderStatus;
    const toStatus = destination.droppableId as OrderStatus;
    const orderId = Number(draggableId);

    if (fromStatus !== toStatus && !ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus)) {
      return; // transição inválida — o card volta sozinho pro lugar de origem
    }

    const previousColumns = columns;
    const order = previousColumns
      .find((c) => c.status === fromStatus)
      ?.orders.find((o) => o.id === orderId);
    if (!order) return;

    const nextColumns = previousColumns.map((column) => {
      if (column.status === fromStatus) {
        return { ...column, orders: column.orders.filter((o) => o.id !== orderId) };
      }
      if (column.status === toStatus) {
        const orders = [...column.orders];
        orders.splice(destination.index, 0, { ...order, status: toStatus });
        return { ...column, orders };
      }
      return column;
    });
    setColumns(nextColumns);

    if (fromStatus !== toStatus) {
      const { ok } = await updateOrderStatusAction(orderId, toStatus);
      if (!ok) {
        setColumns(previousColumns);
      }
    }
  }

  const activeColumn = columns.find((c) => c.status === activeMobileStatus) ?? columns[0];

  return (
    <>
      {/* Mobile: uma coluna por vez, com abas — sem arrastar-e-soltar (não dá
          pra arrastar pra uma coluna escondida). Avançar o status usa os
          mesmos botões já presentes no OrderCard. Pensado pra quem acompanha
          o pedido pelo celular na cozinha/balcão, ex: abrir e ver só "Em
          Preparo". */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {columns.map((column) => (
            <button
              key={column.status}
              type="button"
              onClick={() => setActiveMobileStatus(column.status)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                column.status === activeMobileStatus
                  ? "bg-brand text-white"
                  : "border border-zinc-300 text-zinc-600"
              }`}
            >
              {ORDER_STATUS_LABELS[column.status]}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  column.status === activeMobileStatus ? "bg-white/20" : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {column.orders.length}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {activeColumn?.orders.map((order) => (
            <OrderCard key={order.id} order={order} onOpenDetail={onOpenOrder} />
          ))}
          {(!activeColumn || activeColumn.orders.length === 0) && (
            <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-400">
              Nenhum pedido
            </p>
          )}
        </div>
      </div>

      {/* Desktop: as 5 colunas lado a lado, com arrastar-e-soltar. */}
      <div className="hidden lg:block">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-5 gap-3">
            {columns.map((column) => (
              <Droppable key={column.status} droppableId={column.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-w-0 flex-col gap-3 rounded-xl p-1 transition-colors ${
                      snapshot.isDraggingOver ? "bg-brand/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-semibold text-zinc-700">
                        {ORDER_STATUS_LABELS[column.status]}
                      </h2>
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {column.orders.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {column.orders.map((order, index) => (
                        <Draggable key={order.id} draggableId={String(order.id)} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={dragSnapshot.isDragging ? "rotate-1 opacity-90" : ""}
                            >
                              <OrderCard order={order} onOpenDetail={onOpenOrder} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {column.orders.length === 0 && (
                        <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                          Nenhum pedido
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </>
  );
}
