import Link from "next/link";
import type { SessionData } from "@/types/session";
import { logoutAction } from "@/app/admin/(protected)/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/catalog", label: "Cardápio" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/simulator", label: "Simulador WhatsApp" },
  { href: "/admin/settings", label: "Configurações" },
];

export function AdminTopNav({ session }: { session: SessionData }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white font-bold">
            Z
          </span>
          <span>
            <span className="block text-sm font-bold text-zinc-900">ZapFood</span>
            <span className="block text-xs text-zinc-500">{session.storeName}</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-zinc-600">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Sair ({session.staffName})
          </button>
        </form>
      </div>
    </header>
  );
}
