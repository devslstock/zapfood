import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { updateProductAction, deleteProductAction } from "../../../actions";
import { AddOnFields } from "../../../AddOnFields";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, storeId: session.storeId },
      include: { addOns: true },
    }),
    prisma.category.findMany({ where: { storeId: session.storeId }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-zinc-900">Editar produto</h1>
      <form action={updateProductAction.bind(null, product.id)} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-zinc-700">
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product.categoryId}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Nome
          </label>
          <input
            id="name"
            name="name"
            defaultValue={product.name}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
            Descrição (opcional)
          </label>
          <input
            id="description"
            name="description"
            defaultValue={product.description ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="priceReais" className="block text-sm font-medium text-zinc-700">
            Preço (R$)
          </label>
          <input
            id="priceReais"
            name="priceReais"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={(product.priceCents / 100).toFixed(2)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-700">
            URL da imagem (opcional)
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product.imageUrl ?? ""}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <AddOnFields initial={product.addOns.map((addOn) => ({ name: addOn.name, priceCents: addOn.priceCents }))} />

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="active" defaultChecked={product.active} />
          Produto ativo (visível no cardápio)
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Salvar
          </button>
          <Link
            href="/admin/catalog"
            className="rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cancelar
          </Link>
        </div>
      </form>
      <form action={deleteProductAction.bind(null, product.id)} className="mt-6">
        <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
          Excluir produto
        </button>
      </form>
    </div>
  );
}
