"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroyPlatformSession } from "@/lib/auth/platformSession";
import { requirePlatformSession } from "@/lib/auth/guards";
import { createStoreWithOwner, CreateStoreError } from "@/lib/store/createStoreWithOwner";

export async function platformLogoutAction() {
  await destroyPlatformSession();
  redirect("/super-admin/login");
}

const newStoreSchema = z.object({
  storeName: z.string().min(2, "Nome da loja muito curto."),
  ownerName: z.string().min(2, "Nome do dono(a) muito curto."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  cpfCnpj: z.string().min(1, "Informe o CPF ou CNPJ."),
  whatsappContactPhone: z.string().min(8, "Informe um telefone/WhatsApp válido."),
  category: z.string().min(1, "Informe a categoria da loja."),
});

export type CreateStoreState = { error?: string; ok?: boolean };

// Mesmo fluxo do cadastro público (/cadastro) — incluindo e-mail de
// confirmação e assinatura no Asaas — só que iniciado pelo super-admin em
// vez do próprio dono preencher (decisão explícita: sem atalho aqui).
export async function createStoreAction(
  _prevState: CreateStoreState,
  formData: FormData
): Promise<CreateStoreState> {
  await requirePlatformSession();

  const parsed = newStoreSchema.safeParse({
    storeName: formData.get("storeName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    cpfCnpj: formData.get("cpfCnpj"),
    whatsappContactPhone: formData.get("whatsappContactPhone"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createStoreWithOwner({
      ...parsed.data,
      cpfCnpjDigits: parsed.data.cpfCnpj.replace(/\D/g, ""),
    });
  } catch (error) {
    if (error instanceof CreateStoreError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/super-admin");
  return { ok: true };
}
