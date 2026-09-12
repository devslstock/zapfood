import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { SessionData } from "@/types/session";

const COOKIE_NAME = "zapfood_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET não está configurado.");
  }
  return value;
}

function sign(sessionId: string): string {
  const mac = createHmac("sha256", secret()).update(sessionId).digest("hex");
  return `${sessionId}.${mac}`;
}

function unsign(cookieValue: string): string | null {
  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const sessionId = cookieValue.slice(0, separatorIndex);
  const mac = cookieValue.slice(separatorIndex + 1);
  const expectedMac = createHmac("sha256", secret()).update(sessionId).digest("hex");
  const macBuffer = Buffer.from(mac, "hex");
  const expectedBuffer = Buffer.from(expectedMac, "hex");
  if (macBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(macBuffer, expectedBuffer)) return null;
  return sessionId;
}

export async function createSession(staffId: string): Promise<void> {
  const sessionId = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: sessionId, staffId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sign(sessionId), {
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

  const sessionId = unsign(raw);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { staff: { include: { store: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    staffId: session.staff.id,
    staffName: session.staff.name,
    role: session.staff.role as SessionData["role"],
    storeId: session.staff.store.id,
    storeName: session.staff.store.name,
    storeSlug: session.staff.store.slug,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  const sessionId = raw ? unsign(raw) : null;

  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  cookieStore.delete(COOKIE_NAME);
}
