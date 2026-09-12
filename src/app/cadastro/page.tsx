import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function CadastroPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-100">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            Z
          </span>
          ZapFood
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900">Crie sua conta grátis</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Comece a receber pedidos pelo WhatsApp em poucos minutos.
        </p>

        <div className="mt-8">
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem uma conta?{" "}
          <Link href="/admin/login" className="font-medium text-brand-dark hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
