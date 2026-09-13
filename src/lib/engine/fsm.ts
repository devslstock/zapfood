import { formatCents } from "@/lib/money";
import { DELIVERY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/domain";
import {
  INITIAL_STATE,
  type CartLine,
  type CatalogSnapshot,
  type ConversationStateData,
  type StepInput,
  type StepResult,
} from "@/lib/engine/types";

const RESET_WORDS = new Set(["cancelar", "menu"]);

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function parseChoice(text: string, max: number): number | null {
  const digits = normalize(text).match(/^\d+$/);
  if (!digits) return null;
  const value = Number(digits[0]);
  if (value < 1 || value > max) return null;
  return value;
}

function formatCategoryList(catalog: CatalogSnapshot): string {
  const lines = catalog.categories.map(
    (category, index) => `${index + 1}. ${category.name}`
  );
  return ["Escolha uma categoria:", ...lines].join("\n");
}

function formatProductList(categoryId: string, catalog: CatalogSnapshot): string {
  const products = catalog.productsByCategory[categoryId] ?? [];
  const lines = products.map(
    (product, index) =>
      `${index + 1}. ${product.name} - ${formatCents(product.priceCents)}`
  );
  return [
    "Escolha um produto (ou digite 'voltar' para outra categoria):",
    ...lines,
  ].join("\n");
}

function formatCart(cart: CartLine[]): string {
  return cart
    .map((line) => `${line.quantity}x ${line.name} - ${formatCents(line.unitPriceCents * line.quantity)}`)
    .join("\n");
}

function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
}

function buildSummary(state: ConversationStateData): string {
  const parts = [
    "Resumo do pedido:",
    formatCart(state.cart),
    `Total: ${formatCents(cartTotal(state.cart))}`,
    `Entrega: ${state.deliveryType ? DELIVERY_TYPE_LABELS[state.deliveryType] : "-"}`,
  ];
  if (state.deliveryType === "ENTREGA") {
    parts.push(`Endereço: ${state.address}`);
  }
  parts.push(
    `Pagamento: ${state.paymentMethod ? PAYMENT_METHOD_LABELS[state.paymentMethod] : "-"}`
  );
  parts.push("1. Confirmar\n2. Cancelar");
  return parts.join("\n");
}

function greeting(catalog: CatalogSnapshot): StepResult {
  return {
    state: { ...INITIAL_STATE, step: "AWAITING_CATEGORY" },
    messages: [
      "Olá! 👋 Bem-vindo(a). Vamos montar seu pedido.",
      formatCategoryList(catalog),
    ],
  };
}

export function step({ text, state, catalog }: StepInput): StepResult {
  const normalized = normalize(text);

  if (RESET_WORDS.has(normalized) && state.step !== "GREETING") {
    return {
      state: { ...INITIAL_STATE },
      messages: [
        normalized === "cancelar"
          ? "Pedido cancelado. Digite qualquer mensagem para recomeçar."
          : "Ok, voltando ao início. Digite qualquer mensagem para ver o cardápio.",
      ],
    };
  }

  switch (state.step) {
    case "GREETING":
      return greeting(catalog);

    case "AWAITING_CATEGORY": {
      const choice = parseChoice(text, catalog.categories.length);
      if (!choice) {
        return {
          state,
          messages: ["Não entendi. " + formatCategoryList(catalog)],
        };
      }
      const category = catalog.categories[choice - 1];
      return {
        state: { ...state, step: "AWAITING_PRODUCT", pendingCategoryId: category.id },
        messages: [formatProductList(category.id, catalog)],
      };
    }

    case "AWAITING_PRODUCT": {
      const categoryId = state.pendingCategoryId!;
      if (normalized === "voltar") {
        return {
          state: { ...state, step: "AWAITING_CATEGORY", pendingCategoryId: undefined },
          messages: [formatCategoryList(catalog)],
        };
      }
      const products = catalog.productsByCategory[categoryId] ?? [];
      const choice = parseChoice(text, products.length);
      if (!choice) {
        return {
          state,
          messages: ["Não entendi. " + formatProductList(categoryId, catalog)],
        };
      }
      const product = products[choice - 1];
      return {
        state: { ...state, step: "AWAITING_QUANTITY", pendingProductId: product.id },
        messages: [`Quantas unidades de "${product.name}" você quer?`],
      };
    }

    case "AWAITING_QUANTITY": {
      const match = normalized.match(/^\d+$/);
      const quantity = match ? Number(match[0]) : 0;
      if (!quantity || quantity < 1) {
        return {
          state,
          messages: ["Não entendi a quantidade. Digite um número, por exemplo: 2"],
        };
      }
      const product = catalog.productsById[state.pendingProductId!];
      const cart = [...state.cart];
      const existingIndex = cart.findIndex((line) => line.productId === product.id);
      if (existingIndex >= 0) {
        cart[existingIndex] = {
          ...cart[existingIndex],
          quantity: cart[existingIndex].quantity + quantity,
        };
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity,
        });
      }
      return {
        state: { ...state, step: "AWAITING_MORE_ITEMS", cart, pendingProductId: undefined },
        messages: [
          `Adicionado!\n\n${formatCart(cart)}\n\nDeseja adicionar mais alguma coisa?\n1. Sim\n2. Não, finalizar pedido`,
        ],
      };
    }

    case "AWAITING_MORE_ITEMS": {
      if (normalized === "1") {
        return {
          state: { ...state, step: "AWAITING_CATEGORY", pendingCategoryId: undefined },
          messages: [formatCategoryList(catalog)],
        };
      }
      if (normalized === "2") {
        return {
          state: { ...state, step: "AWAITING_DELIVERY_TYPE" },
          messages: ["Como prefere receber?\n1. Entrega\n2. Retirada"],
        };
      }
      return {
        state,
        messages: ["Não entendi. Deseja adicionar mais alguma coisa?\n1. Sim\n2. Não, finalizar pedido"],
      };
    }

    case "AWAITING_DELIVERY_TYPE": {
      if (normalized === "1") {
        return {
          state: { ...state, step: "AWAITING_ADDRESS", deliveryType: "ENTREGA" },
          messages: ["Qual o endereço completo para entrega?"],
        };
      }
      if (normalized === "2") {
        return {
          state: { ...state, step: "AWAITING_PAYMENT_METHOD", deliveryType: "RETIRADA" },
          messages: ["Forma de pagamento?\n1. Dinheiro\n2. Cartão\n3. Pix"],
        };
      }
      return {
        state,
        messages: ["Não entendi. Como prefere receber?\n1. Entrega\n2. Retirada"],
      };
    }

    case "AWAITING_ADDRESS": {
      const address = text.trim();
      if (!address) {
        return { state, messages: ["Por favor, envie o endereço completo."] };
      }
      return {
        state: { ...state, step: "AWAITING_PAYMENT_METHOD", address },
        messages: ["Forma de pagamento?\n1. Dinheiro\n2. Cartão\n3. Pix"],
      };
    }

    case "AWAITING_PAYMENT_METHOD": {
      const methodMap = { "1": "DINHEIRO", "2": "CARTAO", "3": "PIX" } as const;
      const method = methodMap[normalized as keyof typeof methodMap];
      if (!method) {
        return {
          state,
          messages: ["Não entendi. Forma de pagamento?\n1. Dinheiro\n2. Cartão\n3. Pix"],
        };
      }
      const nextState: ConversationStateData = {
        ...state,
        step: "AWAITING_CONFIRMATION",
        paymentMethod: method,
      };
      return { state: nextState, messages: [buildSummary(nextState)] };
    }

    case "AWAITING_CONFIRMATION": {
      if (normalized === "1") {
        return {
          state: { ...INITIAL_STATE },
          messages: [],
          orderIntent: {
            deliveryType: state.deliveryType!,
            address: state.address,
            paymentMethod: state.paymentMethod!,
            cart: state.cart,
          },
        };
      }
      if (normalized === "2") {
        return {
          state: { ...INITIAL_STATE },
          messages: ["Pedido cancelado. Digite qualquer mensagem para recomeçar."],
        };
      }
      return { state, messages: ["Não entendi. " + buildSummary(state)] };
    }

    default:
      return greeting(catalog);
  }
}
