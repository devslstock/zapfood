// Normaliza texto de bairro pra comparação tolerante a acento/maiúscula/
// espaços nas pontas — usado tanto no cálculo da taxa (servidor) quanto na
// prévia exibida no checkout (cliente), pra dar o mesmo resultado nos dois.
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function normalizeNeighborhood(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export type DeliveryZoneEntry = { neighborhood: string; feeCents: number };

// Extrai o bairro de um endereço já formatado pelo checkout do cardápio
// digital (`${rua}, ${numero} - ${bairro}, ${cidade}/${uf} - CEP ${cep}`) —
// usado quando o cliente reaproveita um endereço salvo (CustomerAddress só
// guarda a string final, sem campo de bairro separado).
export function parseNeighborhoodFromFormattedAddress(address: string): string | undefined {
  const match = address.match(/-\s*([^,]+),\s*[^/]+\/[A-Za-z]{2}\s*-\s*CEP/);
  return match?.[1]?.trim();
}

export function resolveDeliveryFeeCents(
  neighborhood: string | undefined | null,
  zones: DeliveryZoneEntry[],
  defaultFeeCents: number
): number {
  if (!neighborhood) return defaultFeeCents;
  const normalized = normalizeNeighborhood(neighborhood);
  const match = zones.find((zone) => normalizeNeighborhood(zone.neighborhood) === normalized);
  return match ? match.feeCents : defaultFeeCents;
}
