import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { defaultOpeningHours } from "../src/lib/openingHours";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedPlatformAdmin() {
  const email = process.env.PLATFORM_ADMIN_EMAIL || "admin@zaapfood.app";
  const existing = await prisma.platformAdmin.findUnique({ where: { email } });
  if (existing) return;

  const password = process.env.PLATFORM_ADMIN_PASSWORD || "zaapfood-admin123";
  await prisma.platformAdmin.create({
    data: {
      name: process.env.PLATFORM_ADMIN_NAME || "Administrador ZaapFood",
      email,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log("Super-admin criado:", email, "/", password);
}

async function backfillEmailVerification() {
  // Confirmação de e-mail é feature nova: contas de Staff criadas antes dela
  // existir (como a loja demo, se já tiver sido semeada) são consideradas
  // verificadas automaticamente, para não travar logins já existentes.
  const { count } = await prisma.staff.updateMany({
    where: { emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });
  if (count > 0) {
    console.log(`Backfill: ${count} conta(s) existente(s) marcada(s) como e-mail confirmado.`);
  }
}

async function main() {
  await seedPlatformAdmin();
  await backfillEmailVerification();

  const existing = await prisma.store.findUnique({
    where: { slug: "sorveteria-da-maria" },
  });
  if (existing) {
    console.log("Loja demo já existe, pulando seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("zaapfood123", 10);

  // Product carrega storeId direto (além de categoryId) para permitir filtrar
  // `where: { storeId }` sem precisar de join por Category em toda query —
  // por isso categorias/produtos são criados à parte, com storeId explícito,
  // em vez de aninhados sob Store (nested create só preenche a FK do caminho
  // percorrido, e Product tem duas FKs: store e category).
  const store = await prisma.store.create({
    data: {
      name: "Sorveteria da Maria",
      slug: "sorveteria-da-maria",
      whatsappVerifyToken: "zaapfood-demo-verify",
      whatsappContactPhone: "+5511988887777",
      openingHoursJson: JSON.stringify(defaultOpeningHours("10:00", "22:00")),
      staff: {
        create: {
          name: "Maria Souza",
          email: "dono@zaapfood.demo",
          passwordHash,
          role: "OWNER",
          emailVerifiedAt: new Date(),
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
      optionGroups?: {
        name: string;
        minSelect: number;
        maxSelect: number;
        options: { name: string; priceCents: number }[];
      }[];
    }[];
  }[] = [
    {
      category: "Sorvetes",
      products: [
        {
          name: "Casquinha de Chocolate",
          description: "Casquinha crocante com sorvete de chocolate",
          priceCents: 800,
          optionGroups: [
            {
              name: "Tamanho",
              minSelect: 1,
              maxSelect: 1,
              options: [
                { name: "Pequena", priceCents: 0 },
                { name: "Grande", priceCents: 200 },
              ],
            },
            {
              name: "Adicionais",
              minSelect: 0,
              maxSelect: 99,
              options: [{ name: "Granulado", priceCents: 100 }],
            },
          ],
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
          optionGroups: product.optionGroups
            ? {
                create: product.optionGroups.map((group, groupIndex) => ({
                  name: group.name,
                  minSelect: group.minSelect,
                  maxSelect: group.maxSelect,
                  sortOrder: groupIndex,
                  options: {
                    create: group.options.map((option, optionIndex) => ({
                      name: option.name,
                      priceCents: option.priceCents,
                      sortOrder: optionIndex,
                    })),
                  },
                })),
              }
            : undefined,
        },
      });
    }
  }

  console.log("Loja demo criada:", store.slug);
  console.log("Login admin: dono@zaapfood.demo / zaapfood123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
