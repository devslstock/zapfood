import { LoginForm } from "./LoginForm";
import { SlDevFooter } from "@/components/SlDevFooter";

export default function PlatformLoginPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-950 px-6 py-16">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-8 w-8 rounded-lg" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900">Painel ZaapFood</h1>
          <p className="mt-1 text-sm text-zinc-500">Acesso restrito à equipe da plataforma.</p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
      <SlDevFooter variant="dark" />
    </div>
  );
}
