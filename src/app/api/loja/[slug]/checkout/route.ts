import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/orders/createOrder";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { formatCents } from "@/lib/money";
import { hashPassword } from "@/lib/auth/password";
import { DELIVERY_TYPES, PAYMENT_METHODS } from "@/lib/domain";
import type { CartLine } from "@/lib/engine/types";

const bodySchema = z.object({
  customerName: z.string().trim().min(1, "Informe seu nome.").max(120),
  customerPhone: z.string().trim().min(8, "Informe um WhatsApp válido."),
  deliveryType: z.enum(DELIVERY_TYPES),
  address: z.string().trim().max(300).optional(),
  addressLat: z.number().min(-90).max(90).optional(),
  addressLng: z.number().min(-180).max(180).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  // Presente só quando o cliente escolheu "Criar conta" — define/atualiza o
  // PIN de 4 dígitos que protege os dados salvos.
  pin: z.string().trim().regex(/^\d{4}$/).optional(),
  // Endereço reaproveitado/editado de uma conta existente — atualiza o
  // registro em vez de criar um novo.
  addressId: z.string().optional(),
  // Se deve persistir o endereço deste pedido em CustomerAddress (conta nova
  // ou endereço novo adicionado por quem já tem conta).
  saveAddress: z.boolean().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        selectedOptionIds: z.array(z.string()).default([]),
      })
    )
    .min(1, "Carrinho vazio."),
});

// Checkout público do cardápio digital: cria um pedido de verdade (mesmo
// caminho usado pelo motor de conversa do WhatsApp) a partir do carrinho
// montado na página, sem exigir que o cliente converse com o bot. Preço e
// validade dos complementos são sempre recalculados aqui — nunca confia no
// que o cliente mandou.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.deliveryType === "ENTREGA" && !data.address) {
    return NextResponse.json({ error: "Informe o endereço de entrega." }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
  }
  if (!store.active) {
    return NextResponse.json({ error: "Esta loja está indisponível no momento." }, { status: 403 });
  }

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId: store.id, active: true },
    include: { optionGroups: { include: { options: true } } },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  const cart: CartLine[] = [];
  for (const item of data.items) {
    const product = productsById.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "Um dos itens do carrinho não está mais disponível." },
        { status: 400 }
      );
    }

    const selectedIds = new Set(item.selectedOptionIds);
    const options: { groupName: string; name: string; priceCents: number }[] = [];

    for (const group of product.optionGroups) {
      const chosenInGroup = group.options.filter(
        (option) => option.active && selectedIds.has(option.id)
      );
      if (chosenInGroup.length < group.minSelect || chosenInGroup.length > group.maxSelect) {
        return NextResponse.json(
          { error: `Escolha corretamente as opções de "${group.name}" para ${product.name}.` },
          { status: 400 }
        );
      }
      for (const option of chosenInGroup) {
        options.push({ groupName: group.name, name: option.name, priceCents: option.priceCents });
      }
    }

    cart.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      options: options.length ? options : undefined,
    });
  }

  const phone = data.customerPhone.replace(/\D/g, "");

  const pinHash = data.pin ? await hashPassword(data.pin) : undefined;
  const customer = await prisma.customer.upsert({
    where: { storeId_phone: { storeId: store.id, phone } },
    update: { name: data.customerName, ...(pinHash ? { pinHash } : {}) },
    create: { storeId: store.id, phone, name: data.customerName, pinHash },
  });

  if (data.deliveryType === "ENTREGA" && data.address) {
    if (data.addressId) {
      // Só atualiza um endereço que realmente pertence a este cliente —
      // evita que um addressId de outra conta seja usado pra sobrescrever.
      await prisma.customerAddress.updateMany({
        where: { id: data.addressId, customerId: customer.id },
        data: { address: data.address, addressLat: data.addressLat, addressLng: data.addressLng },
      });
    } else if (data.saveAddress) {
      await prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          address: data.address,
          addressLat: data.addressLat,
          addressLng: data.addressLng,
        },
      });
    }
  }

  const order = await createOrder(store.id, customer.id, {
    deliveryType: data.deliveryType,
    address: data.deliveryType === "ENTREGA" ? data.address : undefined,
    addressLat: data.deliveryType === "ENTREGA" ? data.addressLat : undefined,
    addressLng: data.deliveryType === "ENTREGA" ? data.addressLng : undefined,
    neighborhood: data.deliveryType === "ENTREGA" ? data.neighborhood : undefined,
    paymentMethod: data.paymentMethod,
    cart,
  });

  const confirmationLines = [
    `Olá, ${data.customerName}! Seu pedido já foi encaminhado para a cozinha. 🎉`,
    "",
    ...cart.map((line) => {
      const optionsTotal = (line.options ?? []).reduce((sum, o) => sum + o.priceCents, 0);
      const optionsText = line.options?.length
        ? ` (${line.options.map((o) => o.name).join(", ")})`
        : "";
      return `${line.quantity}x ${line.name}${optionsText} - ${formatCents(
        (line.unitPriceCents + optionsTotal) * line.quantity
      )}`;
    }),
    "",
    ...(order.deliveryFeeCents > 0 ? [`Taxa de entrega: ${formatCents(order.deliveryFeeCents)}`] : []),
    `Total: ${formatCents(order.totalCents)}`,
    "",
    "Te avisaremos por aqui assim que o pedido sair para entrega/retirada.",
  ];

  try {
    await sendWhatsAppMessage(store, phone, confirmationLines.join("\n"));
  } catch (error) {
    console.error("[checkout] falha ao enviar confirmação pelo WhatsApp", error);
  }

  return NextResponse.json({ orderId: order.id, totalCents: order.totalCents });
}
