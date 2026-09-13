import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/auth/cookieToken";
import type { SessionData } from "@/types/session";

const COOKIE_NAME = "zaapfood_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export async function createSession(staffId: string): Promise<void> {
  const sessionId = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: sessionId, staffId, expiresAt },
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

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const sessionId = verifyToken(raw);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { staff: { include: { store: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Loja desativada (inadimplência) ou e-mail ainda não confirmado: trata
  // como sessão inválida em todo lugar que chama getSession/requireSession,
  // sem precisar repetir a checagem em cada página/rota.
  if (!session.staff.store.active || !session.staff.emailVerifiedAt) {
    return null;
  }

  return {
    staffId: session.staff.id,
    staffName: session.staff.name,
    role: session.staff.role as SessionData["role"],
    permissions: {
      orders: session.staff.canViewOrders,
      products: session.staff.canViewProducts,
      customers: session.staff.canViewCustomers,
      reports: session.staff.canViewReports,
      finance: session.staff.canViewFinance,
      settings: session.staff.canViewSettings,
    },
    storeId: session.staff.store.id,
    storeName: session.staff.store.name,
    storeSlug: session.staff.store.slug,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const sessionId = raw ? verifyToken(raw) : null;

  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  cookieStore.delete(COOKIE_NAME);
}
