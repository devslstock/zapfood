import "server-only";
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";

// Linha única com config global da plataforma (hoje só o preço do plano
// único). upsert em vez de depender do seed, pra funcionar mesmo em bancos
// já existentes que nunca rodaram o seed de novo.
export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export async function updateDefaultPlanMonthlyCents(cents: number) {
  return prisma.platformSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { defaultPlanMonthlyCents: cents },
    create: { id: SETTINGS_ID, defaultPlanMonthlyCents: cents },
  });
}
