"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";

const schema = z.object({
  storeName: z.string().min(2, "Nome da loja muito curto."),
  ownerName: z.string().min(2, "Seu nome é muito curto."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { storeName, ownerName, email, password } = parsed.data;

  const existingStaff = await prisma.staff.findUnique({ where: { email } });
  if (existingStaff) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const baseSlug = slugify(storeName) || "loja";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.store.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await hashPassword(password);

  const store = await prisma.store.create({
    data: {
      name: storeName,
      slug,
      staff: {
        create: { name: ownerName, email, passwordHash, role: "OWNER" },
      },
    },
    include: { staff: true },
  });

  await createSession(store.staff[0].id);

  redirect("/admin");
}
