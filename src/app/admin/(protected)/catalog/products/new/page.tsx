import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createProductAction } from "../../actions";
import { AddOnFields } from "../../AddOnFields";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const session = await requireSession();
  const { categoryId } = await searchParams;
  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-zinc-900">Novo produto</h1>
      <form action={createProductAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-zinc-700">
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={categoryId ?? ""}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="" disabled>
              Escolha uma categoria...
            </option>
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
            required
            placeholder="Casquinha de Chocolate"
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
            placeholder="8.00"
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
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <AddOnFields />

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
    </div>
  );
}
