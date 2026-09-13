"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createStoreWithOwner, CreateStoreError } from "@/lib/store/createStoreWithOwner";

const schema = z.object({
  storeName: z.string().min(2, "Nome da loja muito curto."),
  ownerName: z.string().min(2, "Seu nome é muito curto."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  cpfCnpj: z.string().min(1, "Informe seu CPF ou CNPJ."),
  whatsappContactPhone: z.string().min(8, "Informe um telefone/WhatsApp válido."),
  category: z.string().min(1, "Informe a categoria da loja."),
});

export type SignupState = { error?: string };

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = schema.safeParse({
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

  if (formData.get("termsAccepted") !== "on") {
    return { error: "É preciso aceitar os termos de uso e a política de privacidade." };
  }

  const recaptchaOk = await verifyRecaptcha(formData.get("g-recaptcha-response") as string | null);
  if (!recaptchaOk) {
    return { error: "Confirme que você não é um robô." };
  }

  const { storeName, ownerName, email, password, cpfCnpj, whatsappContactPhone, category } = parsed.data;

  let invoiceUrl: string | null;
  try {
    const result = await createStoreWithOwner({
      storeName,
      ownerName,
      email,
      password,
      cpfCnpjDigits: cpfCnpj.replace(/\D/g, ""),
      whatsappContactPhone,
      category,
    });
    invoiceUrl = result.invoiceUrl;
  } catch (error) {
    if (error instanceof CreateStoreError) {
      return { error: error.message };
    }
    throw error;
  }

  const params = new URLSearchParams({ email });
  if (invoiceUrl) params.set("invoiceUrl", invoiceUrl);
  redirect(`/cadastro/verifique-email?${params.toString()}`);
}
