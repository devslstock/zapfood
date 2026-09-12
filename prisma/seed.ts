import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.store.findUnique({
    where: { slug: "sorveteria-da-maria" },
  });
  if (existing) {
    console.log("Loja demo já existe, pulando seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("zapfood123", 10);

  // Product carrega storeId direto (além de categoryId) para permitir filtrar
  // `where: { storeId }` sem precisar de join por Category em toda query —
  // por isso categorias/produtos são criados à parte, com storeId explícito,
  // em vez de aninhados sob Store (nested create só preenche a FK do caminho
  // percorrido, e Product tem duas FKs: store e category).
  const store = await prisma.store.create({
    data: {
      name: "Sorveteria da Maria",
      slug: "sorveteria-da-maria",
      whatsappVerifyToken: "zapfood-demo-verify",
      whatsappContactPhone: "+5511988887777",
      staff: {
        create: {
          name: "Maria Souza",
          email: "dono@zapfood.demo",
          passwordHash,
          role: "OWNER",
        },
      },
      customers: {
        create: [{ phone: "+5511999990000", name: "Cliente Teste" }],
      },
    },
  });

  const catalog: {
    category: string;
    products: {
      name: string;
      description?: string;
      priceCents: number;
      addOns?: { name: string; priceCents: number }[];
    }[];
  }[] = [
    {
      category: "Sorvetes",
      products: [
        {
          name: "Casquinha de Chocolate",
          description: "Casquinha crocante com sorvete de chocolate",
          priceCents: 800,
          addOns: [{ name: "Granulado", priceCents: 100 }],
        },
        { name: "Casquinha de Baunilha", priceCents: 800 },
        { name: "Copo 2 Bolas", description: "Escolha dois sabores", priceCents: 1200 },
      ],
    },
    {
      category: "Milk-shakes",
      products: [
        { name: "Milk-shake de Morango", priceCents: 1500 },
        { name: "Milk-shake de Chocolate", priceCents: 1500 },
      ],
    },
    {
      category: "Açaí",
      products: [
        { name: "Açaí 300ml", priceCents: 1400 },
        { name: "Açaí 500ml", priceCents: 1900 },
      ],
    },
  ];

  for (const [categoryIndex, { category, products }] of catalog.entries()) {
    const createdCategory = await prisma.category.create({
      data: { storeId: store.id, name: category, sortOrder: categoryIndex },
    });

    for (const [productIndex, product] of products.entries()) {
      await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: createdCategory.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          sortOrder: productIndex,
          addOns: product.addOns
            ? { create: product.addOns }
            : undefined,
        },
      });
    }
  }

  console.log("Loja demo criada:", store.slug);
  console.log("Login admin: dono@zapfood.demo / zapfood123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
