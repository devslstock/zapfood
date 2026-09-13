import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC de cookies de sessão (compartilhado entre a sessão de loja e a do
// super-admin) — evita depender de Edge runtime/JWT libs de terceiros.
function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET não está configurado.");
  }
  return value;
}

export function signToken(id: string): string {
  const mac = createHmac("sha256", secret()).update(id).digest("hex");
  return `${id}.${mac}`;
}

export function verifyToken(cookieValue: string): string | null {
  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const id = cookieValue.slice(0, separatorIndex);
  const mac = cookieValue.slice(separatorIndex + 1);
  const expectedMac = createHmac("sha256", secret()).update(id).digest("hex");
  const macBuffer = Buffer.from(mac, "hex");
  const expectedBuffer = Buffer.from(expectedMac, "hex");
  if (macBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(macBuffer, expectedBuffer)) return null;
  return id;
}
