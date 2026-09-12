"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/money";

type Product = { id: string; name: string; description: string | null; priceCents: number };
type Category = { id: string; name: string; products: Product[] };

export function DigitalMenu({
  storeName,
  whatsappContactPhone,
  categories,
}: {
  storeName: string;
  whatsappContactPhone: string | null;
  categories: Category[];
}) {
  const [cart, setCart] = useState<Record<string, number>>({});

  const productsById = useMemo(() => {
    const map: Record<string, Product> = {};
    categories.forEach((category) =>
      category.products.forEach((product) => {
        map[product.id] = product;
      })
    );
    return map;
  }, [categories]);

  const totalCents = Object.entries(cart).reduce(
    (sum, [productId, quantity]) => sum + (productsById[productId]?.priceCents ?? 0) * quantity,
    0
  );
  const totalItems = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  function addToCart(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      if (!prev[productId]) return prev;
      const next = { ...prev, [productId]: prev[productId] - 1 };
      if (next[productId] <= 0) delete next[productId];
      return next;
    });
  }

  const whatsappHref = useMemo(() => {
    if (!whatsappContactPhone || totalItems === 0) return null;
    const lines = [`Olá! Gostaria de fazer o seguinte pedido na ${storeName}:`, ""];
    Object.entries(cart).forEach(([productId, quantity]) => {
      const product = productsById[productId];
      if (!product) return;
      lines.push(`${quantity}x ${product.name} - ${formatCents(product.priceCents * quantity)}`);
    });
    lines.push("", `Total: ${formatCents(totalCents)}`);
    const phone = whatsappContactPhone.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [cart, productsById, whatsappContactPhone, storeName, totalCents, totalItems]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      <header className="bg-brand px-6 py-8 text-white">
        <h1 className="text-2xl font-bold">{storeName}</h1>
        <p className="mt-1 text-sm text-white/80">Monte seu pedido e envie pelo WhatsApp</p>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-6">
        {categories.length === 0 && (
          <p className="text-center text-sm text-zinc-500">Cardápio ainda não disponível.</p>
        )}
        {categories.map((category) => (
          <section key={category.id} className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900">{category.name}</h2>
            <div className="mt-3 flex flex-col gap-3">
              {category.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-zinc-500">{product.description}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-brand-dark">
                      {formatCents(product.priceCents)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {cart[product.id] > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600"
                          aria-label={`Remover ${product.name}`}
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-medium">
                          {cart[product.id]}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white"
                      aria-label={`Adicionar ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">{totalItems} item(ns)</p>
              <p className="font-bold text-zinc-900">{formatCents(totalCents)}</p>
            </div>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
              >
                Pedir pelo WhatsApp
              </a>
            ) : (
              <p className="text-sm text-red-600">Esta loja ainda não configurou o WhatsApp.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
