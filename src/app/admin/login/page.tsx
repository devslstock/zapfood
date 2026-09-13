import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-100">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-8 w-8 rounded-lg" />
          ZaapFood
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900">Entrar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Acesse o painel da sua loja. Demo: dono@zaapfood.demo / zaapfood123
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Ainda não tem loja?{" "}
          <Link href="/cadastro" className="font-medium text-brand-dark hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
