import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWebhookPayload } from "@/lib/whatsapp/payload";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { runTurn } from "@/lib/engine/runTurn";

// Handshake de verificação da Meta: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const matchingStore = await prisma.store.findFirst({
    where: { whatsappVerifyToken: token },
  });
  const globalToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (matchingStore || (globalToken && token === globalToken)) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// Recebe mensagens reais da Cloud API. Sempre responde 200 (mesmo em erro
// interno) para evitar que a Meta entre em retry storm.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const messages = parseWebhookPayload(body);

  for (const message of messages) {
    try {
      const store = await prisma.store.findFirst({
        where: { whatsappPhoneNumberId: message.phoneNumberId },
      });
      if (!store) {
        console.warn(
          `[whatsapp webhook] nenhuma loja associada ao phone_number_id ${message.phoneNumberId}`
        );
        continue;
      }
      if (!store.active) {
        console.warn(`[whatsapp webhook] loja ${store.slug} está desativada, ignorando mensagem`);
        continue;
      }

      const { messages: replies } = await runTurn(
        store.id,
        message.from,
        message.text,
        message.contactName
      );

      for (const reply of replies) {
        await sendWhatsAppMessage(store, message.from, reply);
      }
    } catch (error) {
      console.error("[whatsapp webhook] erro ao processar mensagem", error);
    }
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
