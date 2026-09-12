"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";

const whatsappSchema = z.object({
  whatsappContactPhone: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappToken: z.string().optional(),
  whatsappVerifyToken: z.string().optional(),
});

export async function updateWhatsappSettingsAction(formData: FormData) {
  const session = await requireSession();
  requireRole(session, "OWNER");

  const parsed = whatsappSchema.parse({
    whatsappContactPhone: formData.get("whatsappContactPhone") || undefined,
    whatsappPhoneNumberId: formData.get("whatsappPhoneNumberId") || undefined,
    whatsappToken: formData.get("whatsappToken") || undefined,
    whatsappVerifyToken: formData.get("whatsappVerifyToken") || undefined,
  });

  await prisma.store.update({
    where: { id: session.storeId },
    data: {
      whatsappContactPhone: parsed.whatsappContactPhone || null,
      whatsappPhoneNumberId: parsed.whatsappPhoneNumberId || null,
      whatsappToken: parsed.whatsappToken || null,
      whatsappVerifyToken: parsed.whatsappVerifyToken || null,
    },
  });

  revalidatePath("/admin/settings");
}

const staffSchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

export async function createStaffAction(formData: FormData) {
  const session = await requireSession();
  requireRole(session, "OWNER");

  const parsed = staffSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const existing = await prisma.staff.findUnique({ where: { email: parsed.email } });
  if (existing) {
    throw new Error("Já existe uma conta com este e-mail.");
  }

  const passwordHash = await hashPassword(parsed.password);
  await prisma.staff.create({
    data: {
      storeId: session.storeId,
      name: parsed.name,
      email: parsed.email,
      passwordHash,
      role: "STAFF",
    },
  });

  revalidatePath("/admin/settings");
}

export async function deleteStaffAction(staffId: string) {
  const session = await requireSession();
  requireRole(session, "OWNER");

  await prisma.staff.deleteMany({
    where: { id: staffId, storeId: session.storeId, role: "STAFF" },
  });

  revalidatePath("/admin/settings");
}
