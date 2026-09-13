import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/slug";
import { sendVerificationEmail } from "@/lib/email/verification";
import { createAsaasCustomer, createAsaasSubscriptionWithInvoice, TRIAL_DAYS } from "@/lib/asaas/client";
import { getPlatformSettings } from "@/lib/platformSettings";
import { normalizeBrazilPhone } from "@/lib/phone";

export type CreateStoreWithOwnerInput = {
  storeName: string;
  ownerName: string;
  email: string;
  password: string;
  cpfCnpjDigits: string;
  whatsappContactPhone: string;
  category: string;
};

export class CreateStoreError extends Error {}

function toDueDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Fluxo completo de criação de uma loja + dono(a): usado tanto pelo cadastro
// público (self-service, ver src/app/cadastro/actions.ts) quanto pelo botão
// "Nova Loja" do super-admin — mesmo caminho, incluindo e-mail de
// confirmação e configuração automática da assinatura no Asaas, pra manter
// as duas lojas criadas de formas idênticas (decisão explícita: o super-admin
// não pula a confirmação de e-mail).
export async function createStoreWithOwner(input: CreateStoreWithOwnerInput) {
  if (input.cpfCnpjDigits.length !== 11 && input.cpfCnpjDigits.length !== 14) {
    throw new CreateStoreError("CPF deve ter 11 dígitos e CNPJ 14 dígitos.");
  }

  const existingStaff = await prisma.staff.findUnique({ where: { email: input.email } });
  if (existingStaff) {
    throw new CreateStoreError("Já existe uma conta com este e-mail.");
  }

  const baseSlug = slugify(input.storeName) || "loja";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.store.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await hashPassword(input.password);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const store = await prisma.store.create({
    data: {
      name: input.storeName,
      slug,
      cnpjCpf: input.cpfCnpjDigits,
      trialEndsAt,
      whatsappContactPhone: normalizeBrazilPhone(input.whatsappContactPhone),
      category: input.category,
      termsAcceptedAt: new Date(),
      staff: {
        create: { name: input.ownerName, email: input.email, passwordHash, role: "OWNER" },
      },
    },
    include: { staff: true },
  });

  await sendVerificationEmail(store.staff[0].id, input.ownerName, input.email);

  // A conta já é utilizável assim que o e-mail for confirmado — a assinatura
  // no Asaas só controla a cobrança recorrente a partir do fim do teste
  // grátis, sem bloquear o acesso caso essa etapa falhe.
  let invoiceUrl: string | null = null;
  try {
    const settings = await getPlatformSettings();
    const customer = await createAsaasCustomer({
      name: input.storeName,
      cpfCnpj: input.cpfCnpjDigits,
      email: input.email,
    });
    await prisma.store.update({ where: { id: store.id }, data: { asaasCustomerId: customer.id } });

    const subscription = await createAsaasSubscriptionWithInvoice({
      customerId: customer.id,
      storeId: store.id,
      valueCents: settings.defaultPlanMonthlyCents,
      nextDueDate: toDueDateString(trialEndsAt),
    });
    await prisma.store.update({
      where: { id: store.id },
      data: { asaasSubscriptionId: subscription.subscriptionId },
    });
    invoiceUrl = subscription.invoiceUrl;
  } catch (error) {
    console.error("[createStoreWithOwner] falha ao configurar cobrança no Asaas", error);
  }

  return { store, invoiceUrl };
}
