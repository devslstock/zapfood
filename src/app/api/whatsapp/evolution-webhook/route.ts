import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEvolutionMessageUpsert, parseEvolutionConnectionUpdate } from "@/lib/evolution/payload";
import { handleIncomingMessage } from "@/lib/whatsapp/incoming";

// Webhook da Evolution API — diferente do webhook único da Meta (que roteia
// pelo phone_number_id dentro do corpo), aqui cada loja tem sua própria URL
// registrada na criação da instance, com "instance" + "token" na query string
// como única autenticação (a Evolution não tem handshake nem assinatura HMAC
// como a Meta). Ver getEvolutionWebhookUrl em src/lib/storeUrl.ts.
//
// Sempre responde 200, mesmo em erro interno — mesmo motivo do webhook da
// Meta: evitar retry storm do lado de fora.
export async function POST(request: NextRequest) {
  const instance = request.nextUrl.searchParams.get("instance");
  const token = request.nextUrl.searchParams.get("token");
  if (!instance || !token) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const store = await prisma.store.findUnique({ where: { evolutionInstanceName: instance } });
  // Resposta igual (200 "ignored") tanto pra instance desconhecida quanto pra
  // token errado — não dá pra alguém de fora descobrir por tentativa se uma
  // instance existe.
  if (!store || store.evolutionWebhookToken !== token) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }
  if (!store.active) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  try {
    const connectionUpdate = parseEvolutionConnectionUpdate(body);
    if (connectionUpdate) {
      if (connectionUpdate.state === "open") {
        await prisma.store.update({
          where: { id: store.id },
          data: { whatsappProvider: "EVOLUTION", whatsappConnectionOk: true, whatsappLastTestedAt: new Date() },
        });
      } else if (connectionUpdate.state === "close" && store.whatsappProvider === "EVOLUTION") {
        await prisma.store.update({
          where: { id: store.id },
          data: { whatsappConnectionOk: false, whatsappLastTestedAt: new Date() },
        });
      }
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const message = parseEvolutionMessageUpsert(body);
    if (message) {
      await handleIncomingMessage(store, message.from, message.text, message.contactName);
    }
  } catch (error) {
    console.error("[evolution webhook] erro ao processar evento", error);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
