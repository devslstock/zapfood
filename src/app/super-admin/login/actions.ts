"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createPlatformSession } from "@/lib/auth/platformSession";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export type PlatformLoginState = { error?: string };

export async function platformLoginAction(
  _prevState: PlatformLoginState,
  formData: FormData
): Promise<PlatformLoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, password } = parsed.data;
  const admin = await prisma.platformAdmin.findUnique({ where: { email } });

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { error: "E-mail ou senha inválidos." };
  }

  await createPlatformSession(admin.id);
  redirect("/super-admin");
}
