import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getPlatformSession } from "@/lib/auth/platformSession";
import { PERMISSIONS, type Permission } from "@/lib/domain";
import type { SessionData, PlatformSessionData } from "@/types/session";

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export function requireRole(
  session: SessionData,
  role: SessionData["role"],
  redirectTo = "/admin/orders"
): void {
  if (session.role !== role) {
    redirect(redirectTo);
  }
}

const PERMISSION_PATHS: Record<Permission, string> = {
  orders: "/admin/orders",
  products: "/admin/catalog",
  customers: "/admin/clientes",
  reports: "/admin/relatorios",
  finance: "/admin/settings",
  settings: "/admin/settings",
};

// Primeira página que a sessão consegue abrir — usada como destino de
// redirecionamento quando uma checagem de permissão falha (em vez de sempre
// mandar pra /admin/orders, que pode estar desmarcado pro membro também).
export function firstAllowedPath(session: SessionData): string {
  if (session.role === "OWNER") return "/admin";
  for (const permission of PERMISSIONS) {
    if (session.permissions[permission]) return PERMISSION_PATHS[permission];
  }
  return "/admin/sem-acesso";
}

export function hasPermission(session: SessionData, permission: Permission): boolean {
  return session.role === "OWNER" || session.permissions[permission];
}

export function requirePermission(session: SessionData, permission: Permission): void {
  if (!hasPermission(session, permission)) {
    redirect(firstAllowedPath(session));
  }
}

export function requireAnyPermission(session: SessionData, permissions: Permission[]): void {
  if (session.role === "OWNER") return;
  if (!permissions.some((permission) => session.permissions[permission])) {
    redirect(firstAllowedPath(session));
  }
}

export async function requirePlatformSession(): Promise<PlatformSessionData> {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/super-admin/login");
  }
  return session;
}
