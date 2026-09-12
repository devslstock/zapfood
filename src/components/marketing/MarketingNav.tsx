import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            Z
          </span>
          ZapFood
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 sm:flex">
          <a href="#como-funciona" className="hover:text-zinc-900">
            Como funciona
          </a>
          <a href="#planos" className="hover:text-zinc-900">
            Planos
          </a>
          <a href="#depoimentos" className="hover:text-zinc-900">
            Clientes
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/login"
            className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Testar grátis
          </Link>
        </div>
      </nav>
    </header>
  );
}
