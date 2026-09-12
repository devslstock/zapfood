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

export type CartLine = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
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
