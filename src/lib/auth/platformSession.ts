import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/auth/cookieToken";
import type { PlatformSessionData } from "@/types/session";

const COOKIE_NAME = "zaapfood_platform_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas — sessão de operador da plataforma, mais curta que a de loja.

export async function createPlatformSession(adminId: string): Promise<void> {
  const sessionId = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.platformSession.create({
    data: { id: sessionId, adminId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signToken(sessionId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getPlatformSession(): Promise<PlatformSessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const sessionId = verifyToken(raw);
  if (!sessionId) return null;

  const session = await prisma.platformSession.findUnique({
    where: { id: sessionId },
    include: { admin: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    adminId: session.admin.id,
    adminName: session.admin.name,
    adminEmail: session.admin.email,
  };
}

export async function destroyPlatformSession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const sessionId = raw ? verifyToken(raw) : null;

  if (sessionId) {
    await prisma.platformSession.deleteMany({ where: { id: sessionId } });
  }

  cookieStore.delete(COOKIE_NAME);
}
