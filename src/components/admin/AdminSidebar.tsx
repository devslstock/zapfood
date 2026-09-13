import type { SessionData } from "@/types/session";
import type { Permission } from "@/lib/domain";
import { hasPermission, firstAllowedPath } from "@/lib/auth/guards";
import { logoutAction } from "@/app/admin/(protected)/actions";
import { SidebarShell } from "@/components/admin/SidebarShell";

const NAV_ITEMS: { href: string; label: string; ownerOnly?: boolean; permission?: Permission }[] = [
  { href: "/admin", label: "Dashboard", ownerOnly: true },
  { href: "/admin/catalog", label: "Cardápio", permission: "products" },
  { href: "/admin/orders", label: "Pedidos", permission: "orders" },
  { href: "/admin/clientes", label: "Clientes", permission: "customers" },
  { href: "/admin/relatorios", label: "Relatórios", permission: "reports" },
  { href: "/admin/simulator", label: "Simulador WhatsApp", permission: "settings" },
  { href: "/admin/settings", label: "Configurações", permission: "settings" },
];

export function AdminSidebar({ session }: { session: SessionData }) {
  const isOwner = session.role === "OWNER";
  const visibleItems = NAV_ITEMS.filter(
    (item) => isOwner || (!item.ownerOnly && item.permission && hasPermission(session, item.permission))
  );
  // Configurações também abre pra quem só tem "Financeiro" (a aba Assinatura
  // mora lá dentro) — sem isso esse membro perderia o link de todo.
  if (!isOwner && !visibleItems.some((item) => item.href === "/admin/settings") && hasPermission(session, "finance")) {
    visibleItems.push({ href: "/admin/settings", label: "Configurações" });
  }

  return (
    <SidebarShell
      items={visibleItems.map(({ href, label }) => ({ href, label }))}
      homeHref={isOwner ? "/admin" : firstAllowedPath(session)}
      title="ZaapFood"
      subtitle={session.storeName}
      footer={
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Sair ({session.staffName})
          </button>
        </form>
      }
    />
  );
}
