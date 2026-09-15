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

// Qual integração de WhatsApp está ativa para uma loja — "META" (Cloud API
// oficial) ou "EVOLUTION" (QR Code/Baileys, self-hosted). Ver Store.whatsappProvider.
export const WHATSAPP_PROVIDERS = ["META", "EVOLUTION"] as const;
export type WhatsappProvider = (typeof WHATSAPP_PROVIDERS)[number];

export const ROLES = ["OWNER", "BALCAO", "COZINHEIRO", "CAIXA", "ENTREGADOR"] as const;
export type Role = (typeof ROLES)[number];

// Papéis que o dono(a) pode atribuir a membros da equipe (todos exceto OWNER,
// que existe uma única vez por loja, criado no cadastro).
export const STAFF_ROLES = ROLES.filter((role) => role !== "OWNER") as Exclude<Role, "OWNER">[];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Dono(a)",
  BALCAO: "Balcão",
  COZINHEIRO: "Cozinheiro(a)",
  CAIXA: "Caixa",
  ENTREGADOR: "Entregador(a)",
};

// Permissões de painel configuráveis por membro da equipe em /admin/settings
// (aba Equipe). Ignoradas para OWNER, que sempre tem acesso total. A chave
// bate com a coluna `canView<Chave>` em Staff (ver prisma/schema.prisma).
export const PERMISSIONS = ["orders", "products", "customers", "reports", "finance", "settings"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  orders: "Pedidos",
  products: "Produtos",
  customers: "Clientes",
  reports: "Relatórios",
  finance: "Financeiro",
  settings: "Configurações",
};

export type PermissionFlags = Record<Permission, boolean>;

// Permissões padrão para um membro recém-criado — preserva o comportamento
// anterior (equipe só via Pedidos) até o dono ajustar manualmente.
export const DEFAULT_STAFF_PERMISSIONS: PermissionFlags = {
  orders: true,
  products: false,
  customers: false,
  reports: false,
  finance: false,
  settings: false,
};

export const PAYMENT_STATUSES = ["EM_DIA", "INADIMPLENTE"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EM_DIA: "Em dia",
  INADIMPLENTE: "Inadimplente",
};

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
