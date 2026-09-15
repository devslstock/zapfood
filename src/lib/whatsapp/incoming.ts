import type { Store } from "@/generated/prisma/client";
import { runTurn } from "@/lib/engine/runTurn";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

// Ponto único usado pelos dois webhooks de WhatsApp (Meta e Evolution) depois
// que cada um já resolveu/autenticou a Store e o texto recebido — roda o
// motor de conversa (agnóstico de transporte) e manda as respostas de volta
// pelo mesmo canal por onde a mensagem chegou.
export async function handleIncomingMessage(
  store: Store,
  from: string,
  text: string,
  contactName?: string
): Promise<void> {
  const { messages: replies } = await runTurn(store.id, from, text, contactName);
  for (const reply of replies) {
    await sendWhatsAppMessage(store, from, reply);
  }
}
