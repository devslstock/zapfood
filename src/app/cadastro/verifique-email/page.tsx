import Link from "next/link";
import { SlDevFooter } from "@/components/SlDevFooter";

export default async function VerifiqueEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; invoiceUrl?: string }>;
}) {
  const { email, invoiceUrl } = await searchParams;

  return (
    <>
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-zinc-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl">
          📩
        </div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enviamos um link de confirmação para{" "}
          {email ? <strong className="text-zinc-900">{email}</strong> : "o seu e-mail"}. Clique
          nele para ativar sua conta e entrar no painel.
        </p>

        {invoiceUrl ? (
          <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-left">
            <p className="text-sm font-medium text-zinc-900">Falta um passo: forma de pagamento</p>
            <p className="mt-1 text-xs text-zinc-500">
              Você tem 7 dias grátis. Cadastre o cartão ou pague por PIX numa página segura do
              Asaas — o ZaapFood não vê nem guarda esses dados.
            </p>
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Configurar pagamento (cartão ou PIX)
            </a>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Sua conta já está liberada, mas ainda falta configurar a forma de pagamento (cartão ou
            PIX). Você pode fazer isso a qualquer momento em Configurações → Assinatura.
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-400">
          Não recebeu? Verifique o spam ou tente entrar novamente para reenviar o link.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Ir para o login
        </Link>
      </div>
    </div>
    <SlDevFooter />
    </>
  );
}
