"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformSession } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { PAYMENT_STATUSES } from "@/lib/domain";

const financialSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
  planMonthlyReais: z.coerce.number().min(0).optional(),
  adminNotes: z.string().optional(),
});

export async function updateFinancialAction(storeId: string, formData: FormData) {
  await requirePlatformSession();

  const rawPlan = formData.get("planMonthlyReais");
  const parsed = financialSchema.parse({
    paymentStatus: formData.get("paymentStatus"),
    planMonthlyReais: rawPlan ? Number(rawPlan) : undefined,
    adminNotes: formData.get("adminNotes") || undefined,
  });

  await prisma.store.update({
    where: { id: storeId },
    data: {
      paymentStatus: parsed.paymentStatus,
      planMonthlyCents:
        parsed.planMonthlyReais !== undefined ? Math.round(parsed.planMonthlyReais * 100) : null,
      adminNotes: parsed.adminNotes || null,
    },
  });

  revalidatePath(`/super-admin/${storeId}`);
  revalidatePath("/super-admin");
}

export async function toggleActiveAction(storeId: string) {
  await requirePlatformSession();

  const store = await prisma.store.findUniqueOrThrow({ where: { id: storeId } });
  const nextActive = !store.active;
  await prisma.store.update({
    where: { id: storeId },
    data: { active: nextActive, deactivatedAt: nextActive ? null : new Date() },
  });

  revalidatePath(`/super-admin/${storeId}`);
  revalidatePath("/super-admin");
}

export async function updatePlanPriceAction(storeId: string, formData: FormData) {
  await requirePlatformSession();

  const planMonthlyReais = Number(formData.get("planMonthlyReais"));
  const planMonthlyCents = Number.isFinite(planMonthlyReais) && planMonthlyReais > 0
    ? Math.round(planMonthlyReais * 100)
    : null;

  await prisma.store.update({ where: { id: storeId }, data: { planMonthlyCents } });

  revalidatePath(`/super-admin/${storeId}`);
  revalidatePath("/super-admin");
}

const companySchema = z.object({
  cnpjCpf: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
});

export async function updateCompanyInfoAction(storeId: string, formData: FormData) {
  await requirePlatformSession();

  const parsed = companySchema.parse({
    cnpjCpf: formData.get("cnpjCpf") || undefined,
    addressStreet: formData.get("addressStreet") || undefined,
    addressNumber: formData.get("addressNumber") || undefined,
    addressComplement: formData.get("addressComplement") || undefined,
    addressNeighborhood: formData.get("addressNeighborhood") || undefined,
    addressCity: formData.get("addressCity") || undefined,
    addressState: formData.get("addressState") || undefined,
    addressZip: formData.get("addressZip") || undefined,
  });

  await prisma.store.update({
    where: { id: storeId },
    data: {
      cnpjCpf: parsed.cnpjCpf || null,
      addressStreet: parsed.addressStreet || null,
      addressNumber: parsed.addressNumber || null,
      addressComplement: parsed.addressComplement || null,
      addressNeighborhood: parsed.addressNeighborhood || null,
      addressCity: parsed.addressCity || null,
      addressState: parsed.addressState || null,
      addressZip: parsed.addressZip || null,
    },
  });

  revalidatePath(`/super-admin/${storeId}`);
}

export type ResetPasswordState = { newPassword?: string; error?: string };

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

export async function resetOwnerPasswordAction(
  storeId: string,
  _prevState: ResetPasswordState,
  _formData: FormData
): Promise<ResetPasswordState> {
  await requirePlatformSession();

  const owner = await prisma.staff.findFirst({ where: { storeId, role: "OWNER" } });
  if (!owner) {
    return { error: "Dono(a) da loja não encontrado(a)." };
  }

  const newPassword = generateTempPassword();
  await prisma.staff.update({
    where: { id: owner.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { newPassword };
}
