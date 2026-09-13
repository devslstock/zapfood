"use client";

import { useState } from "react";
import Link from "next/link";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { formatCents } from "@/lib/money";
import {
  deleteCategoryAction,
  deleteProductAction,
  reorderCategoriesAction,
  reorderProductsAction,
} from "@/app/admin/(protected)/catalog/actions";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  active: boolean;
  optionGroups: { name: string; options: { name: string }[] }[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  active: boolean;
  products: CatalogProduct[];
};

function signature(categories: CatalogCategory[]): string {
  return categories
    .map((c) => `${c.id}:${c.products.map((p) => p.id).join(",")}`)
    .join("|");
}

export function CatalogBoard({ categories: initialCategories }: { categories: CatalogCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [lastSignature, setLastSignature] = useState(() => signature(initialCategories));

  const nextSignature = signature(initialCategories);
  if (nextSignature !== lastSignature) {
    setLastSignature(nextSignature);
    setCategories(initialCategories);
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "category") {
      const previous = categories;
      const next = [...categories];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      setCategories(next);
      const { ok } = await reorderCategoriesAction(next.map((c) => c.id));
      if (!ok) setCategories(previous);
      return;
    }

    // type === "product": droppableId é o categoryId da coluna.
    const categoryId = source.droppableId;
    if (categoryId !== destination.droppableId) return; // produto só reordena dentro da própria categoria
    const previous = categories;
    const next = categories.map((category) => {
      if (category.id !== categoryId) return category;
      const products = [...category.products];
      const [moved] = products.splice(source.index, 1);
      products.splice(destination.index, 0, moved);
      return { ...category, products };
    });
    setCategories(next);
    const category = next.find((c) => c.id === categoryId);
    if (category) {
      const { ok } = await reorderProductsAction(
        categoryId,
        category.products.map((p) => p.id)
      );
      if (!ok) setCategories(previous);
    }
    void draggableId;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="categories" type="category">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-6">
            {categories.map((category, categoryIndex) => (
              <Draggable key={category.id} draggableId={category.id} index={categoryIndex}>
                {(dragProvided, dragSnapshot) => (
                  <section
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 ${
                      dragSnapshot.isDragging ? "ring-2 ring-brand" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          {...dragProvided.dragHandleProps}
                          aria-label="Arrastar categoria"
                          className="-m-2 cursor-grab p-2 text-lg text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                        >
                          ⠿
                        </span>
                        <h2 className="text-lg font-semibold text-zinc-900">{category.name}</h2>
                        {!category.active && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                            Inativa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Link
                          href={`/admin/catalog/products/new?categoryId=${category.id}`}
                          className="font-medium text-brand-dark hover:underline"
                        >
                          + Produto
                        </Link>
                        <Link
                          href={`/admin/catalog/categories/${category.id}/edit`}
                          className="font-medium text-zinc-600 hover:underline"
                        >
                          Editar
                        </Link>
                        <form action={deleteCategoryAction.bind(null, category.id)}>
                          <button type="submit" className="font-medium text-red-600 hover:underline">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </div>

                    <Droppable droppableId={category.id} type="product">
                      {(productProvided) => (
                        <ul
                          ref={productProvided.innerRef}
                          {...productProvided.droppableProps}
                          className="mt-4 flex flex-col divide-y divide-zinc-100"
                        >
                          {category.products.map((product, productIndex) => (
                            <Draggable key={product.id} draggableId={product.id} index={productIndex}>
                              {(productDragProvided, productDragSnapshot) => (
                                <li
                                  ref={productDragProvided.innerRef}
                                  {...productDragProvided.draggableProps}
                                  className={`flex flex-wrap items-center justify-between gap-2 bg-white py-3 ${
                                    productDragSnapshot.isDragging ? "rounded-lg ring-2 ring-brand" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span
                                      {...productDragProvided.dragHandleProps}
                                      aria-label="Arrastar produto"
                                      className="-m-2 cursor-grab p-2 text-lg text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
                                    >
                                      ⠿
                                    </span>
                                    <div>
                                      <p className="font-medium text-zinc-900">
                                        {product.name}{" "}
                                        {!product.active && (
                                          <span className="text-xs text-zinc-400">(inativo)</span>
                                        )}
                                      </p>
                                      {product.description && (
                                        <p className="text-sm text-zinc-500">{product.description}</p>
                                      )}
                                      {product.optionGroups.length > 0 && (
                                        <p className="mt-1 text-xs text-zinc-400">
                                          {product.optionGroups
                                            .map(
                                              (group) =>
                                                `${group.name}: ${group.options
                                                  .map((option) => option.name)
                                                  .join(", ")}`
                                            )
                                            .join(" · ")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-zinc-900">
                                      {formatCents(product.priceCents)}
                                    </span>
                                    <Link
                                      href={`/admin/catalog/products/${product.id}/edit`}
                                      className="text-sm font-medium text-zinc-600 hover:underline"
                                    >
                                      Editar
                                    </Link>
                                    <form action={deleteProductAction.bind(null, product.id)}>
                                      <button
                                        type="submit"
                                        className="text-sm font-medium text-red-600 hover:underline"
                                      >
                                        Excluir
                                      </button>
                                    </form>
                                  </div>
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {productProvided.placeholder}
                          {category.products.length === 0 && (
                            <li className="py-3 text-sm text-zinc-400">
                              Nenhum produto nesta categoria ainda.
                            </li>
                          )}
                        </ul>
                      )}
                    </Droppable>
                  </section>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
