import "server-only";
import { prisma } from "@/lib/prisma";
import type { CatalogSnapshot } from "@/lib/engine/types";

export async function loadCatalogSnapshot(storeId: string): Promise<CatalogSnapshot> {
  const categories = await prisma.category.findMany({
    where: { storeId, active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const productsByCategory: CatalogSnapshot["productsByCategory"] = {};
  const productsById: CatalogSnapshot["productsById"] = {};

  for (const category of categories) {
    productsByCategory[category.id] = category.products.map((product) => ({
      id: product.id,
      name: product.name,
      priceCents: product.priceCents,
      categoryId: category.id,
    }));
    for (const product of category.products) {
      productsById[product.id] = {
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
        categoryId: category.id,
      };
    }
  }

  return {
    categories: categories.map((category) => ({ id: category.id, name: category.name })),
    productsByCategory,
    productsById,
  };
}
