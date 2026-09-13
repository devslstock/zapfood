import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStoreOpenStatus } from "@/lib/openingHours";
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
      deliveryZones: { select: { neighborhood: true, feeCents: true } },
      categories: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { active: true },
            orderBy: { sortOrder: "asc" },
            include: {
              optionGroups: {
                orderBy: { sortOrder: "asc" },
                include: { options: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!store) notFound();

  if (!store.active) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-zinc-900">Cardápio indisponível</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Esta loja está temporariamente fora do ar. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  // Best-effort: usado só pra calcular "taxa de conversão" nos Relatórios,
  // nunca deve derrubar o cardápio se o insert falhar.
  prisma.menuView.create({ data: { storeId: store.id } }).catch(() => {});

  return (
    <DigitalMenu
      slug={slug}
      storeName={store.name}
      logoUrl={store.logoUrl}
      coverImageUrl={store.coverImageUrl}
      whatsappContactPhone={store.whatsappContactPhone}
      deliveryFeeCents={store.deliveryFeeCents}
      deliveryZones={store.deliveryZones}
      openStatus={getStoreOpenStatus(store.openingHoursJson)}
      categories={store.categories.map((category) => ({
        id: category.id,
        name: category.name,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          optionGroups: product.optionGroups.map((group) => ({
            id: group.id,
            name: group.name,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            options: group.options.map((option) => ({
              id: option.id,
              name: option.name,
              priceCents: option.priceCents,
              imageUrl: option.imageUrl,
            })),
          })),
        })),
      }))}
    />
  );
}
