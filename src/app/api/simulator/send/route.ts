import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { runTurn } from "@/lib/engine/runTurn";

const bodySchema = z.object({
  phone: z.string().min(3),
  text: z.string().min(1),
  customerName: z.string().optional(),
});

// Aciona o mesmo motor de conversa do webhook real, sem rede/credenciais —
// permite testar o fluxo de pedido de ponta a ponta nesta sessão.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { phone, text, customerName } = parsed.data;
  const result = await runTurn(session.storeId, phone, text, customerName);

  return NextResponse.json(result);
}
