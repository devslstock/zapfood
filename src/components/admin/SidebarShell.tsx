"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarNavItem = { href: string; label: string };

export function SidebarShell({
  items,
  homeHref,
  title,
  subtitle,
  footer,
  dark = false,
}: {
  items: SidebarNavItem[];
  homeHref: string;
  title: string;
  subtitle: string;
  footer: ReactNode;
  dark?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fecha o drawer mobile sozinho ao navegar — ajusta o estado durante a
  // própria renderização (padrão recomendado pelo React pra "resetar estado
  // quando as props mudam") em vez de um useEffect, que geraria um re-render
  // extra logo após a troca de página.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const barClasses = dark
    ? "border-zinc-800 bg-zinc-950 text-white"
    : "border-zinc-200 bg-white text-zinc-900";
  const linkClasses = dark
    ? "text-white/70 hover:bg-white/10 hover:text-white"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900";
  const asideClasses = dark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white";

  const navContent = (
    <>
      <Link
        href={homeHref}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2 border-b px-5 py-5 ${dark ? "border-white/10" : "border-zinc-100"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="h-9 w-9 rounded-lg" />
        <span>
          <span className={`block text-sm font-bold ${dark ? "text-white" : "text-zinc-900"}`}>
            {title}
          </span>
          <span className={`block text-xs ${dark ? "text-white/60" : "text-zinc-500"}`}>{subtitle}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm font-medium">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`rounded-lg px-3 py-2.5 ${linkClasses}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={`border-t px-3 py-4 ${dark ? "border-white/10" : "border-zinc-100"}`}>{footer}</div>
    </>
  );

  return (
    <>
      <div className={`flex items-center justify-between border-b px-4 py-3 lg:hidden ${barClasses}`}>
        <Link href={homeHref} className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="text-sm font-bold">{subtitle}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg ${
            dark ? "border-white/20 text-white/80" : "border-zinc-200 text-zinc-600"
          }`}
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-xl ${asideClasses}`}>
            {navContent}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                dark ? "text-white/70 hover:bg-white/10" : "text-zinc-400 hover:bg-zinc-100"
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <aside className={`hidden w-64 shrink-0 flex-col border-r lg:flex ${asideClasses}`}>{navContent}</aside>
    </>
  );
}
