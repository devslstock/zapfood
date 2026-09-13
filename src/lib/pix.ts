// Gera o payload "PIX copia e cola" (BR Code / EMV QR Code do Bacen) a partir
// da chave PIX da loja + valor do pedido — vira um QR code estático que o
// cliente escaneia pra pagar o valor exato. Sem integração com PSP: não há
// confirmação automática de pagamento, é só uma forma prática de cobrar.
// Referência: Manual de Padrões para Iniciação do PIX (Bacen).

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

// Remove acento/caracteres fora do padrão ASCII exigido pelo campo (o BR
// Code não aceita acentuação) e trunca no tamanho máximo do campo.
function sanitizeField(value: string, maxLength: number, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();
  return (normalized || fallback).slice(0, maxLength);
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — exatamente o checksum
// exigido no campo final (63) do BR Code.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amountCents,
  txid,
}: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid: string;
}): string {
  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey.trim());
  const sanitizedTxid = sanitizeField(txid, 25, "***").replace(/ /g, "");
  const additionalData = tlv("05", sanitizedTxid || "***");

  const body =
    tlv("00", "01") + // Payload Format Indicator
    tlv("26", merchantAccountInfo) + // Merchant Account Info (PIX)
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda: Real (BRL)
    tlv("54", (amountCents / 100).toFixed(2)) + // Valor da transação
    tlv("58", "BR") + // País
    tlv("59", sanitizeField(merchantName, 25, "LOJA")) + // Nome do recebedor
    tlv("60", sanitizeField(merchantCity, 15, "BRASIL")) + // Cidade do recebedor
    tlv("62", additionalData); // Identificador da transação (txid)

  const withCrcTag = body + "6304";
  return withCrcTag + crc16(withCrcTag);
}
