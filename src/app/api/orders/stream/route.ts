import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { orderEvents } from "@/lib/events/orderEvents";

export const dynamic = "force-dynamic";

// SSE "quase em tempo real" via EventEmitter em processo — funciona apenas
// com uma única instância do servidor (ver nota em lib/events/orderEvents.ts).
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { storeId } = session;
  const encoder = new TextEncoder();

  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const onOrderChanged = (payload: { storeId: string }) => {
        if (payload.storeId !== storeId) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "orders-changed" })}\n\n`)
        );
      };

      orderEvents.on("order:changed", onOrderChanged);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 25000);

      cleanup = () => {
        clearInterval(heartbeat);
        orderEvents.off("order:changed", onOrderChanged);
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
