export type DayHours = { open: string; close: string; closed: boolean };
// Índice = Date.getDay() (0 = domingo ... 6 = sábado).
export type OpeningHours = DayHours[];

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function defaultOpeningHours(open = "18:00", close = "23:00"): OpeningHours {
  return Array.from({ length: 7 }, () => ({ open, close, closed: false }));
}

export function parseOpeningHours(json: string | null | undefined): OpeningHours | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length === 7) return parsed as OpeningHours;
  } catch {
    // JSON inválido: trata como não configurado.
  }
  return null;
}

export type StoreOpenStatus = { isOpen: boolean; label: string };

// Sem horário configurado, não afirma nada sobre estar aberto/fechado — o
// cardápio simplesmente não mostra o selo (ver DigitalMenu).
export function getStoreOpenStatus(
  json: string | null | undefined,
  now: Date = new Date()
): StoreOpenStatus | null {
  const hours = parseOpeningHours(json);
  if (!hours) return null;

  const today = hours[now.getDay()];
  if (!today || today.closed) {
    return { isOpen: false, label: "Fechado no momento" };
  }

  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Suporta horário que passa da meia-noite (ex: 18:00–02:00).
  const isOpen =
    closeMinutes > openMinutes
      ? minutesNow >= openMinutes && minutesNow < closeMinutes
      : minutesNow >= openMinutes || minutesNow < closeMinutes;

  return {
    isOpen,
    label: isOpen ? `Aberto agora · até ${today.close}` : `Fechado · abre às ${today.open}`,
  };
}
