import Link from "next/link";
import { requireSession, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CatalogBoard } from "@/components/admin/CatalogBoard";

export default async function CatalogPage() {
  const session = await requireSession();
  requirePermission(session, "products");
  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: { optionGroups: { orderBy: { sortOrder: "asc" }, include: { options: true } } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Cardápio</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Categorias e produtos da sua loja. Arraste pelo{" "}
            <span aria-hidden>⠿</span> pra reordenar como aparecem no cardápio digital.
          </p>
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

      <CatalogBoard categories={categories} />
    </div>
  );
}
