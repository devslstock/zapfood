import type { ReactNode } from "react";
import { requirePlatformSession } from "@/lib/auth/guards";
import { SidebarShell } from "@/components/admin/SidebarShell";
import { SlDevFooter } from "@/components/SlDevFooter";
import { platformLogoutAction } from "./actions";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await requirePlatformSession();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <SidebarShell
        items={[
          { href: "/super-admin", label: "Lojas" },
          { href: "/super-admin/configuracoes", label: "Configurações" },
        ]}
        homeHref="/super-admin"
        title="Painel ZaapFood"
        subtitle="Super-admin"
        dark
        footer={
          <form action={platformLogoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-white/20 px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Sair ({session.adminName})
            </button>
          </form>
        }
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex-1">{children}</div>
        <SlDevFooter />
      </main>
    </div>
  );
}
