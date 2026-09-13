// Normaliza um número de telefone/WhatsApp brasileiro pro formato E.164 sem
// o "+" (ex: "5511999999999"), garantindo o código do país "55" na frente —
// usado tanto no cadastro da loja quanto na conta do cliente no checkout.
export function normalizeBrazilPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}
