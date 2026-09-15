import { z } from "zod";

// ATENÇÃO: formato ainda não confirmado contra uma instance real (a Evolution
// API já teve divergências de formato entre versões). Isto é um melhor
// esforço a partir da convenção documentada/observada na comunidade — antes
// de usar em produção, capture um evento de verdade (mensagem real recebida
// e uma reconexão real via QR Code) e ajuste este schema pro formato
// observado, exatamente como já foi feito para src/lib/whatsapp/payload.ts
// (Meta). Ver seção "Verificação" do plano de implementação.

const messageUpsertSchema = z.object({
  event: z.literal("messages.upsert"),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean().optional(),
      id: z.string().optional(),
    }),
    pushName: z.string().optional(),
    message: z
      .object({
        conversation: z.string().optional(),
        extendedTextMessage: z.object({ text: z.string().optional() }).optional(),
      })
      .optional(),
  }),
});

const connectionUpdateSchema = z.object({
  event: z.literal("connection.update"),
  instance: z.string(),
  data: z.object({
    state: z.string().optional(),
  }),
});

export type EvolutionIncomingMessage = {
  instanceName: string;
  from: string;
  text: string;
  contactName?: string;
};

export type EvolutionConnectionUpdate = {
  instanceName: string;
  state: string | undefined;
};

function isGroupJid(jid: string): boolean {
  return jid.endsWith("@g.us");
}

// Retorna null se o evento não for uma mensagem de texto recebida válida
// (mensagem enviada pelo próprio bot, mensagem de grupo, ou tipo não-texto —
// mesma limitação documentada já aceita no caminho da Meta).
export function parseEvolutionMessageUpsert(body: unknown): EvolutionIncomingMessage | null {
  const parsed = messageUpsertSchema.safeParse(body);
  if (!parsed.success) return null;

  const { instance, data } = parsed.data;
  if (data.key.fromMe) return null;
  if (isGroupJid(data.key.remoteJid)) return null;

  const text = data.message?.conversation || data.message?.extendedTextMessage?.text;
  if (!text) return null;

  // remoteJid normalmente vem como "55119...@s.whatsapp.net" — extrai só o número.
  const from = data.key.remoteJid.split("@")[0];

  return { instanceName: instance, from, text, contactName: data.pushName };
}

export function parseEvolutionConnectionUpdate(body: unknown): EvolutionConnectionUpdate | null {
  const parsed = connectionUpdateSchema.safeParse(body);
  if (!parsed.success) return null;
  return { instanceName: parsed.data.instance, state: parsed.data.data.state };
}
