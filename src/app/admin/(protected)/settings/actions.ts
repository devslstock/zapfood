"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, requirePermission } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { STAFF_ROLES, type Permission } from "@/lib/domain";
import { WEEKDAY_LABELS, type OpeningHours } from "@/lib/openingHours";
import {
  createAsaasCustomer,
  createAsaasSubscriptionWithInvoice,
  getLatestInvoiceUrl,
} from "@/lib/asaas/client";
import { getPlatformSettings } from "@/lib/platformSettings";

const whatsappSchema = z.object({
  whatsappContactPhone: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappWabaId: z.string().optional(),
  whatsappToken: z.string().optional(),
  whatsappVerifyToken: z.string().optional(),
});

export async function updateWhatsappSettingsAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const parsed = whatsappSchema.parse({
    whatsappContactPhone: formData.get("whatsappContactPhone") || undefined,
    whatsappPhoneNumberId: formData.get("whatsappPhoneNumberId") || undefined,
    whatsappWabaId: formData.get("whatsappWabaId") || undefined,
    whatsappToken: formData.get("whatsappToken") || undefined,
    whatsappVerifyToken: formData.get("whatsappVerifyToken") || undefined,
  });

  await prisma.store.update({
    where: { id: session.storeId },
    data: {
      whatsappContactPhone: parsed.whatsappContactPhone || null,
      whatsappPhoneNumberId: parsed.whatsappPhoneNumberId || null,
      whatsappWabaId: parsed.whatsappWabaId || null,
      whatsappToken: parsed.whatsappToken || null,
      whatsappVerifyToken: parsed.whatsappVerifyToken || null,
      // Qualquer edição nas credenciais invalida o último teste de conexão —
      // evita mostrar "Conectado" com um token que acabou de ser trocado.
      whatsappConnectionOk: null,
      whatsappLastTestedAt: null,
    },
  });

  revalidatePath("/admin/settings");
}

export type TestConnectionState = { ok: boolean; message: string } | null;

// Chama a Graph API de verdade com as credenciais salvas — não é só validar
// formato, é confirmar que a Meta aceita o token/phoneNumberId.
export async function testWhatsappConnectionAction(): Promise<TestConnectionState> {
  const session = await requireSession();
  requirePermission(session, "settings");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.storeId } });
  if (!store.whatsappPhoneNumberId || !store.whatsappToken) {
    return { ok: false, message: "Preencha Phone Number ID e Access Token antes de testar." };
  }

  let ok = false;
  let message: string;
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${store.whatsappPhoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${store.whatsappToken}` } }
    );
    const data = await response.json();
    if (response.ok) {
      ok = true;
      message = `Conectado! Número verificado: ${data.display_phone_number ?? store.whatsappPhoneNumberId}.`;
    } else {
      message = data?.error?.message || "A Meta recusou as credenciais.";
    }
  } catch {
    message = "Não foi possível conectar à Graph API da Meta. Tente novamente.";
  }

  await prisma.store.update({
    where: { id: session.storeId },
    data: { whatsappConnectionOk: ok, whatsappLastTestedAt: new Date() },
  });
  revalidatePath("/admin/settings");

  return { ok, message };
}

const companySchema = z.object({
  name: z.string().min(2, "Nome da loja muito curto.").optional(),
  cnpjCpf: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
});

export async function updateCompanyInfoAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const parsed = companySchema.parse({
    name: formData.get("name") || undefined,
    cnpjCpf: formData.get("cnpjCpf") || undefined,
    addressStreet: formData.get("addressStreet") || undefined,
    addressNumber: formData.get("addressNumber") || undefined,
    addressComplement: formData.get("addressComplement") || undefined,
    addressNeighborhood: formData.get("addressNeighborhood") || undefined,
    addressCity: formData.get("addressCity") || undefined,
    addressState: formData.get("addressState") || undefined,
    addressZip: formData.get("addressZip") || undefined,
  });

  const digitsOnly = parsed.cnpjCpf?.replace(/\D/g, "");
  if (digitsOnly && digitsOnly.length !== 11 && digitsOnly.length !== 14) {
    throw new Error("CPF deve ter 11 dígitos e CNPJ 14 dígitos.");
  }

  await prisma.store.update({
    where: { id: session.storeId },
    data: {
      ...(parsed.name ? { name: parsed.name } : {}),
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

  revalidatePath("/admin/settings");
}

export async function updatePixKeyAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const pixKey = (formData.get("pixKey") as string)?.trim();
  await prisma.store.update({ where: { id: session.storeId }, data: { pixKey: pixKey || null } });

  revalidatePath("/admin/settings");
}

export async function updateDeliverySettingsAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const feeReais = Number(formData.get("deliveryFeeReais"));
  const deliveryFeeCents = Number.isFinite(feeReais) && feeReais > 0 ? Math.round(feeReais * 100) : 0;

  await prisma.store.update({ where: { id: session.storeId }, data: { deliveryFeeCents } });
  revalidatePath("/admin/settings");
}

const deliveryZoneSchema = z.object({
  neighborhood: z.string().min(1, "Informe o bairro."),
  feeReais: z.coerce.number().min(0, "A taxa não pode ser negativa."),
});

export async function createDeliveryZoneAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const parsed = deliveryZoneSchema.parse({
    neighborhood: formData.get("neighborhood"),
    feeReais: formData.get("feeReais"),
  });

  await prisma.deliveryZone.upsert({
    where: { storeId_neighborhood: { storeId: session.storeId, neighborhood: parsed.neighborhood } },
    update: { feeCents: Math.round(parsed.feeReais * 100) },
    create: {
      storeId: session.storeId,
      neighborhood: parsed.neighborhood,
      feeCents: Math.round(parsed.feeReais * 100),
    },
  });

  revalidatePath("/admin/settings");
}

export async function deleteDeliveryZoneAction(zoneId: string) {
  const session = await requireSession();
  requirePermission(session, "settings");

  await prisma.deliveryZone.deleteMany({ where: { id: zoneId, storeId: session.storeId } });
  revalidatePath("/admin/settings");
}

export async function updateBrandingAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const logoUrl = (formData.get("logoUrl") as string) || "";
  const coverImageUrl = (formData.get("coverImageUrl") as string) || "";

  await prisma.store.update({
    where: { id: session.storeId },
    data: {
      logoUrl: logoUrl || null,
      coverImageUrl: coverImageUrl || null,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/loja/[slug]", "page");
}

export async function updateOpeningHoursAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings");

  const hours: OpeningHours = WEEKDAY_LABELS.map((_, day) => ({
    closed: formData.get(`enabled-${day}`) !== "on",
    open: (formData.get(`open-${day}`) as string) || "18:00",
    close: (formData.get(`close-${day}`) as string) || "23:00",
  }));

  await prisma.store.update({
    where: { id: session.storeId },
    data: { openingHoursJson: JSON.stringify(hours) },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/loja/[slug]", "page");
}

const staffSchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
  role: z.enum(STAFF_ROLES),
});

export async function createStaffAction(formData: FormData) {
  const session = await requireSession();
  requireRole(session, "OWNER");

  const parsed = staffSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
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
      role: parsed.role,
      // Membros de equipe são criados já com acesso liberado pelo dono(a) —
      // só o cadastro público (dono da loja) passa pela confirmação por e-mail.
      emailVerifiedAt: new Date(),
    },
  });

  revalidatePath("/admin/settings");
}

// Só o dono(a) mexe em permissões — inclusive as próprias, nunca de um
// membro comum, pra evitar que alguém sem acesso a Configurações consiga se
// autopromover chamando esta action diretamente.
export async function updateStaffPermissionsAction(staffId: string, formData: FormData) {
  const session = await requireSession();
  requireRole(session, "OWNER");

  const role = z.enum(STAFF_ROLES).parse(formData.get("role"));
  const checked = (permission: Permission) => formData.get(`permission-${permission}`) === "on";

  await prisma.staff.updateMany({
    where: { id: staffId, storeId: session.storeId, role: { not: "OWNER" } },
    data: {
      role,
      canViewOrders: checked("orders"),
      canViewProducts: checked("products"),
      canViewCustomers: checked("customers"),
      canViewReports: checked("reports"),
      canViewFinance: checked("finance"),
      canViewSettings: checked("settings"),
    },
  });

  revalidatePath("/admin/settings");
}

export async function deleteStaffAction(staffId: string) {
  const session = await requireSession();
  requireRole(session, "OWNER");

  await prisma.staff.deleteMany({
    where: { id: staffId, storeId: session.storeId, role: { not: "OWNER" } },
  });

  revalidatePath("/admin/settings");
}

export type StartCheckoutState = { error?: string; url?: string };

// Devolve o link da fatura do Asaas (cartão ou PIX) em vez de redirecionar
// direto — o botão em Configurações abre esse link numa nova aba, pra não
// tirar o dono da tela de administração. Usado tanto pra configurar o
// pagamento pela 1ª vez (se falhou no cadastro) quanto pra pagar/trocar
// depois. Se já existe uma assinatura, reaproveita a fatura em aberto dela
// em vez de criar uma assinatura duplicada.
export async function startAsaasCheckoutAction(
  _prevState: StartCheckoutState,
  _formData: FormData
): Promise<StartCheckoutState> {
  const session = await requireSession();
  requirePermission(session, "finance");

  try {
    const store = await prisma.store.findUniqueOrThrow({ where: { id: session.storeId } });

    if (store.asaasSubscriptionId) {
      const invoiceUrl = await getLatestInvoiceUrl(store.asaasSubscriptionId);
      if (!invoiceUrl) {
        return { error: "Não encontramos nenhuma cobrança para essa assinatura." };
      }
      return { url: invoiceUrl };
    }

    const owner = await prisma.staff.findFirst({ where: { storeId: session.storeId, role: "OWNER" } });
    if (!owner) return { error: "Dono(a) da loja não encontrado(a)." };

    const cpfCnpjDigits = store.cnpjCpf?.replace(/\D/g, "");
    if (!cpfCnpjDigits || (cpfCnpjDigits.length !== 11 && cpfCnpjDigits.length !== 14)) {
      return { error: 'Preencha o CPF/CNPJ em "Dados da empresa" antes de configurar o pagamento.' };
    }

    const settings = await getPlatformSettings();

    let customerId = store.asaasCustomerId;
    if (!customerId) {
      const customer = await createAsaasCustomer({
        name: store.name,
        cpfCnpj: cpfCnpjDigits,
        email: owner.email,
      });
      customerId = customer.id;
      await prisma.store.update({ where: { id: store.id }, data: { asaasCustomerId: customerId } });
    }

    const nextDueDate =
      store.trialEndsAt && store.trialEndsAt > new Date() ? store.trialEndsAt : new Date();

    const subscription = await createAsaasSubscriptionWithInvoice({
      customerId,
      storeId: store.id,
      valueCents: settings.defaultPlanMonthlyCents,
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
    });
    await prisma.store.update({
      where: { id: store.id },
      data: { asaasSubscriptionId: subscription.subscriptionId },
    });

    revalidatePath("/admin/settings");
    return { url: subscription.invoiceUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao configurar pagamento." };
  }
}
