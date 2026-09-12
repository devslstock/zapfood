import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { updateCategoryAction, deleteCategoryAction } from "../../../actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const category = await prisma.category.findFirst({
    where: { id, storeId: session.storeId },
  });
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-bold text-zinc-900">Editar categoria</h1>
      <form action={updateCategoryAction.bind(null, category.id)} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Nome
          </label>
          <input
            id="name"
            name="name"
            defaultValue={category.name}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="active" defaultChecked={category.active} />
          Categoria ativa (visível no cardápio)
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
      <form action={deleteCategoryAction.bind(null, category.id)} className="mt-6">
        <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
          Excluir categoria
        </button>
      </form>
    </div>
  );
}
