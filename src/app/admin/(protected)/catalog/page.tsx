import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { deleteCategoryAction, deleteProductAction } from "./actions";

export default async function CatalogPage() {
  const session = await requireSession();
  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId },
    orderBy: { sortOrder: "asc" },
    include: {
      products: { orderBy: { sortOrder: "asc" }, include: { addOns: true } },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Cardápio</h1>
          <p className="mt-1 text-sm text-zinc-500">Categorias e produtos da sua loja.</p>
        </div>
        <Link
          href="/admin/catalog/categories/new"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Nova categoria
        </Link>
      </div>

      {categories.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Nenhuma categoria cadastrada ainda.
        </p>
      )}

      {categories.map((category) => (
        <section
          key={category.id}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
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

          <ul className="mt-4 divide-y divide-zinc-100">
            {category.products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
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
                  {product.addOns.length > 0 && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Adicionais:{" "}
                      {product.addOns
                        .map((addOn) => `${addOn.name} (+${formatCents(addOn.priceCents)})`)
                        .join(", ")}
                    </p>
                  )}
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
            ))}
            {category.products.length === 0 && (
              <li className="py-3 text-sm text-zinc-400">
                Nenhum produto nesta categoria ainda.
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
