import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { SessionData } from "@/types/session";

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export function requireRole(session: SessionData, role: SessionData["role"]): void {
  if (session.role !== role) {
    redirect("/admin");
  }
}
