import Link from "next/link";
import { formatCents } from "@/lib/money";
import { ZAAPFOOD_MONTHLY_PRICE_CENTS } from "@/lib/pricing";

const FEATURES = [
  "Pedidos ilimitados pelo WhatsApp",
  "Atendimento automático 24 horas por dia",
  "Painel de pedidos com impressão de comanda",
  "Cardápio digital com QR code para compartilhar",
  "Sem comissão por pedido, mensalidade fixa",
];

export function PricingCta() {
  return (
    <section id="planos" className="mx-auto max-w-4xl px-6 py-20">
      <div className="rounded-3xl border border-brand/20 bg-white p-10 text-center shadow-lg">
        <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand-dark">
          Plano único, sem letras miúdas
        </span>
        <p className="mt-6 text-5xl font-extrabold text-zinc-900">
          {formatCents(ZAAPFOOD_MONTHLY_PRICE_CENTS)}
          <span className="text-lg font-medium text-zinc-500">/mês</span>
        </p>
        <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left text-sm text-zinc-700">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-dark">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Link
          href="/cadastro"
          className="mt-8 inline-block rounded-full bg-brand px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
        >
          Quero contratar o ZaapFood
        </Link>
      </div>
    </section>
  );
}
