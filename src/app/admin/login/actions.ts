"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, getSession } from "@/lib/auth/session";
import { firstAllowedPath } from "@/lib/auth/guards";
import { sendVerificationEmail } from "@/lib/email/verification";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginState = { error?: string; needsVerification?: boolean };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, password } = parsed.data;
  const staff = await prisma.staff.findUnique({ where: { email }, include: { store: true } });

  if (!staff || !(await verifyPassword(password, staff.passwordHash))) {
    return { error: "E-mail ou senha inválidos." };
  }

  if (!staff.store.active) {
    return { error: "Esta loja está desativada. Entre em contato com o suporte." };
  }

  if (!staff.emailVerifiedAt) {
    return {
      error: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
      needsVerification: true,
    };
  }

  await createSession(staff.id);
  const session = await getSession();
  redirect(session ? firstAllowedPath(session) : "/admin/login");
}

export type ResendState = { sent?: boolean; error?: string };

export async function resendVerificationAction(
  _prevState: ResendState,
  formData: FormData
): Promise<ResendState> {
  const email = formData.get("email");
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) {
    return { error: "Informe um e-mail válido para reenviar." };
  }

  const staff = await prisma.staff.findUnique({ where: { email: parsed.data } });
  // Não revela se o e-mail existe ou não — mesma resposta nos dois casos.
  if (staff && !staff.emailVerifiedAt) {
    await sendVerificationEmail(staff.id, staff.name, staff.email);
  }

  return { sent: true };
}
