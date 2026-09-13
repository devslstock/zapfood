import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/client";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export async function sendVerificationEmail(staffId: string, name: string, email: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Um link válido por vez: tokens antigos do mesmo staff perdem efeito.
  await prisma.emailVerificationToken.deleteMany({ where: { staffId } });
  await prisma.emailVerificationToken.create({
    data: { staffId, token, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

  await sendEmail(
    email,
    "Confirme seu e-mail — ZaapFood",
    `<p>Olá, ${name}!</p>
     <p>Confirme seu e-mail para ativar sua conta no ZaapFood:</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>
     <p>O link expira em 24 horas.</p>`
  );
}
