import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __zapfoodPrisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__zapfoodPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__zapfoodPrisma = prisma;
}
