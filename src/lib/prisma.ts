import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __zaapfoodPrisma: PrismaClient | undefined;
}

function createClient() {
  // Sem "max", o pool do pg fica em 10 conexões — vira gargalo com muitos
  // pedidos simultâneos (fila de espera por conexão livre). Ajustável via
  // DATABASE_POOL_MAX conforme o limite de conexões do plano do Postgres.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX) || 20,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__zaapfoodPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__zaapfoodPrisma = prisma;
}
