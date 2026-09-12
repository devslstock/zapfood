import { z } from "zod";

const webhookSchema = z.object({
  entry: z
    .array(
      z.object({
        changes: z.array(
          z.object({
            value: z.object({
              metadata: z.object({ phone_number_id: z.string() }),
              contacts: z
                .array(
                  z.object({
                    profile: z.object({ name: z.string().optional() }).optional(),
                    wa_id: z.string().optional(),
                  })
                )
                .optional(),
              messages: z
                .array(
                  z.object({
                    from: z.string(),
                    type: z.string(),
                    text: z.object({ body: z.string() }).optional(),
                  })
                )
                .optional(),
            }),
          })
        ),
      })
    )
    .default([]),
});

export type IncomingMessage = {
  phoneNumberId: string;
  from: string;
  text: string;
  contactName?: string;
};

// Formato exato do webhook da Meta Cloud API. Mensagens que não são texto
// (imagem, áudio, figurinha etc.) são ignoradas nesta versão — limitação
// documentada, não um erro.
export function parseWebhookPayload(body: unknown): IncomingMessage[] {
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) return [];

  const messages: IncomingMessage[] = [];
  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      const { metadata, contacts, messages: msgs } = change.value;
      if (!msgs) continue;
      for (const msg of msgs) {
        if (msg.type !== "text" || !msg.text) continue;
        const contactName = contacts?.find((c) => c.wa_id === msg.from)?.profile?.name;
        messages.push({
          phoneNumberId: metadata.phone_number_id,
          from: msg.from,
          text: msg.text.body,
          contactName,
        });
      }
    }
  }
  return messages;
}
