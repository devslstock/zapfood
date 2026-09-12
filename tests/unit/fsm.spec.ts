import { describe, expect, it } from "vitest";
import { step } from "@/lib/engine/fsm";
import {
  INITIAL_STATE,
  type CatalogSnapshot,
  type ConversationStateData,
} from "@/lib/engine/types";

const catalog: CatalogSnapshot = {
  categories: [
    { id: "cat1", name: "Sorvetes" },
    { id: "cat2", name: "Bebidas" },
  ],
  productsByCategory: {
    cat1: [{ id: "p1", name: "Casquinha", priceCents: 800, categoryId: "cat1" }],
    cat2: [{ id: "p2", name: "Suco", priceCents: 500, categoryId: "cat2" }],
  },
  productsById: {
    p1: { id: "p1", name: "Casquinha", priceCents: 800, categoryId: "cat1" },
    p2: { id: "p2", name: "Suco", priceCents: 500, categoryId: "cat2" },
  },
};

describe("motor de conversa (fsm)", () => {
  it("conduz uma conversa completa até gerar orderIntent", () => {
    let state = { ...INITIAL_STATE };

    let result = step({ text: "oi", state, catalog });
    expect(result.state.step).toBe("AWAITING_CATEGORY");
    expect(result.messages.join("\n")).toContain("1. Sorvetes");
    state = result.state;

    result = step({ text: "1", state, catalog });
    expect(result.state.step).toBe("AWAITING_PRODUCT");
    expect(result.messages.join("\n")).toContain("Casquinha");
    state = result.state;

    result = step({ text: "1", state, catalog });
    expect(result.state.step).toBe("AWAITING_QUANTITY");
    state = result.state;

    result = step({ text: "2", state, catalog });
    expect(result.state.step).toBe("AWAITING_MORE_ITEMS");
    expect(result.state.cart).toEqual([
      { productId: "p1", name: "Casquinha", unitPriceCents: 800, quantity: 2 },
    ]);
    state = result.state;

    result = step({ text: "2", state, catalog });
    expect(result.state.step).toBe("AWAITING_DELIVERY_TYPE");
    state = result.state;

    result = step({ text: "2", state, catalog });
    expect(result.state.step).toBe("AWAITING_PAYMENT_METHOD");
    expect(result.state.deliveryType).toBe("RETIRADA");
    state = result.state;

    result = step({ text: "3", state, catalog });
    expect(result.state.step).toBe("AWAITING_CONFIRMATION");
    expect(result.state.paymentMethod).toBe("PIX");
    expect(result.messages.join("\n")).toContain("Total:");
    state = result.state;

    result = step({ text: "1", state, catalog });
    expect(result.orderIntent).toEqual({
      deliveryType: "RETIRADA",
      address: undefined,
      paymentMethod: "PIX",
      cart: [{ productId: "p1", name: "Casquinha", unitPriceCents: 800, quantity: 2 }],
    });
    expect(result.state.step).toBe("GREETING");
  });

  it("repete o prompt atual quando a entrada não é reconhecida", () => {
    const state = { ...INITIAL_STATE, step: "AWAITING_CATEGORY" as const };
    const result = step({ text: "banana", state, catalog });
    expect(result.state.step).toBe("AWAITING_CATEGORY");
    expect(result.messages.join("\n")).toContain("Não entendi");
  });

  it("reseta a conversa com 'cancelar' a partir de qualquer estado", () => {
    const state = {
      ...INITIAL_STATE,
      step: "AWAITING_PRODUCT" as const,
      pendingCategoryId: "cat1",
      cart: [{ productId: "p1", name: "Casquinha", unitPriceCents: 800, quantity: 1 }],
    };
    const result = step({ text: "cancelar", state, catalog });
    expect(result.state).toEqual(INITIAL_STATE);
    expect(result.messages.join("\n")).toContain("cancelado");
  });

  it("percorre entrega com endereço", () => {
    let state: ConversationStateData = {
      ...INITIAL_STATE,
      step: "AWAITING_MORE_ITEMS",
      cart: [{ productId: "p2", name: "Suco", unitPriceCents: 500, quantity: 1 }],
    };

    let result = step({ text: "2", state, catalog });
    expect(result.state.step).toBe("AWAITING_DELIVERY_TYPE");
    state = result.state;

    result = step({ text: "1", state, catalog });
    expect(result.state.step).toBe("AWAITING_ADDRESS");
    expect(result.state.deliveryType).toBe("ENTREGA");
    state = result.state;

    result = step({ text: "Rua das Flores, 123", state, catalog });
    expect(result.state.step).toBe("AWAITING_PAYMENT_METHOD");
    expect(result.state.address).toBe("Rua das Flores, 123");
  });
});
