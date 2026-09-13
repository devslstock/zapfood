import type { DeliveryType, PaymentMethod } from "@/lib/domain";

export type ConversationStep =
  | "GREETING"
  | "AWAITING_CATEGORY"
  | "AWAITING_PRODUCT"
  | "AWAITING_QUANTITY"
  | "AWAITING_MORE_ITEMS"
  | "AWAITING_DELIVERY_TYPE"
  | "AWAITING_ADDRESS"
  | "AWAITING_PAYMENT_METHOD"
  | "AWAITING_CONFIRMATION";

// Complementos/sabores escolhidos (só o checkout do cardápio digital
// preenche isso hoje — o motor de conversa do WhatsApp ainda não pergunta).
export type SelectedCartOption = { groupName: string; name: string; priceCents: number };

export type CartLine = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  options?: SelectedCartOption[];
};

export type ConversationStateData = {
  step: ConversationStep;
  cart: CartLine[];
  pendingCategoryId?: string;
  pendingProductId?: string;
  deliveryType?: DeliveryType;
  address?: string;
  paymentMethod?: PaymentMethod;
};

export const INITIAL_STATE: ConversationStateData = {
  step: "GREETING",
  cart: [],
};

export type CatalogProduct = {
  id: string;
  name: string;
  priceCents: number;
  categoryId: string;
};

export type CatalogCategory = { id: string; name: string };

export type CatalogSnapshot = {
  categories: CatalogCategory[];
  productsByCategory: Record<string, CatalogProduct[]>;
  productsById: Record<string, CatalogProduct>;
};

export type OrderIntent = {
  deliveryType: DeliveryType;
  address?: string;
  addressLat?: number;
  addressLng?: number;
  // Usado só pra buscar a taxa no catálogo de bairros (DeliveryZone) — não é
  // persistido separadamente, o texto completo já está em `address`.
  neighborhood?: string;
  paymentMethod: PaymentMethod;
  cart: CartLine[];
};

export type StepInput = {
  text: string;
  state: ConversationStateData;
  catalog: CatalogSnapshot;
};

export type StepResult = {
  state: ConversationStateData;
  messages: string[];
  orderIntent?: OrderIntent;
};
