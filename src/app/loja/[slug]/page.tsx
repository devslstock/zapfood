import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DigitalMenu } from "./DigitalMenu";

export default async function StoreMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!store) notFound();

  return (
    <DigitalMenu
      storeName={store.name}
      whatsappContactPhone={store.whatsappContactPhone}
      categories={store.categories.map((category) => ({
        id: category.id,
        name: category.name,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
        })),
      }))}
    />
  );
}
