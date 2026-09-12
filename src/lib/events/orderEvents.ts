import "server-only";
import { EventEmitter } from "node:events";

// Notificação em processo para o painel de pedidos "quase em tempo real" via SSE.
// Limitação conhecida: só funciona com uma única instância do servidor Next.js;
// um deploy multi-instância precisaria de Redis pub/sub ou Postgres LISTEN/NOTIFY.
export const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(200);

export function emitOrderChanged(storeId: string): void {
  orderEvents.emit("order:changed", { storeId });
}
