// Tipos de domínio compartilhados. SQLite não suporta enum nativo no Prisma,
// então status/tipos são String no schema e validados/tipados aqui.

export const ORDER_STATUSES = [
  "RECEBIDO",
  "EM_PREPARO",
  "PRONTO",
  "EM_ENTREGA",
  "CONCLUIDO",
  "CANCELADO",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_TYPES = ["ENTREGA", "RETIRADA"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const PAYMENT_METHODS = ["DINHEIRO", "CARTAO", "PIX"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ROLES = ["OWNER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: "Recebido",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  EM_ENTREGA: "Em entrega",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  ENTREGA: "Entrega",
  RETIRADA: "Retirada",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  PIX: "Pix",
};

// Transições permitidas a partir de cada status. Cancelamento só é possível
// antes do pedido sair para entrega/ficar pronto para retirada.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECEBIDO: ["EM_PREPARO", "CANCELADO"],
  EM_PREPARO: ["PRONTO", "CANCELADO"],
  PRONTO: ["EM_ENTREGA", "CONCLUIDO"],
  EM_ENTREGA: ["CONCLUIDO"],
  CONCLUIDO: [],
  CANCELADO: [],
};

// Colunas exibidas no quadro Kanban (CANCELADO fica numa aba/filtro separado).
export const KANBAN_COLUMNS: OrderStatus[] = [
  "RECEBIDO",
  "EM_PREPARO",
  "PRONTO",
  "EM_ENTREGA",
  "CONCLUIDO",
];
