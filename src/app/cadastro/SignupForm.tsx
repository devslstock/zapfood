"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { signupAction, type SignupState } from "./actions";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: { sitekey: string }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const initialState: SignupState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    window.onRecaptchaLoad = () => {
      if (recaptchaRef.current && widgetId.current === null) {
        widgetId.current = window.grecaptcha!.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
        });
      }
    };
    if (window.grecaptcha?.render) window.onRecaptchaLoad();
  }, []);

  useEffect(() => {
    if (state.error && widgetId.current !== null) {
      window.grecaptcha?.reset(widgetId.current);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="storeName" className="block text-sm font-medium text-zinc-700">
          Nome da loja
        </label>
        <input
          id="storeName"
          name="storeName"
          required
          placeholder="Sorveteria da Maria"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium text-zinc-700">
          Seu nome
        </label>
        <input
          id="ownerName"
          name="ownerName"
          required
          placeholder="Maria Souza"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="cpfCnpj" className="block text-sm font-medium text-zinc-700">
          CPF ou CNPJ
        </label>
        <input
          id="cpfCnpj"
          name="cpfCnpj"
          required
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Usado para configurar sua assinatura (cartão ou PIX) na próxima etapa.
        </p>
      </div>
      <div>
        <label htmlFor="whatsappContactPhone" className="block text-sm font-medium text-zinc-700">
          Telefone / WhatsApp
        </label>
        <input
          id="whatsappContactPhone"
          name="whatsappContactPhone"
          required
          placeholder="(11) 99999-9999"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <p className="mt-1 text-xs text-zinc-400">
          É o número que aparece pro seu cliente clicar e falar com você no cardápio digital.
        </p>
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-700">
          Categoria da loja
        </label>
        <input
          id="category"
          name="category"
          required
          placeholder="Pizzaria, Sorveteria, Hamburgueria..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="voce@exemplo.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          name="termsAccepted"
          required
          className="mt-0.5 rounded border-zinc-300"
        />
        <span>
          Aceito os{" "}
          <Link href="/termos" target="_blank" className="font-medium text-brand-dark hover:underline">
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-medium text-brand-dark hover:underline">
            política de privacidade
          </Link>
          .
        </span>
      </label>

      {RECAPTCHA_SITE_KEY && (
        <div>
          <Script src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit" async defer />
          <div ref={recaptchaRef} />
        </div>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Criando conta..." : "Criar minha conta grátis"}
      </button>
    </form>
  );
}
