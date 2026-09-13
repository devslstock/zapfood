import { getPlatformSettings } from "@/lib/platformSettings";
import { TRIAL_DAYS } from "@/lib/asaas/client";
import { PlanPriceForm } from "./PlanPriceForm";

export default async function PlatformSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configurações da plataforma</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Plano único cobrado automaticamente (cartão ou PIX via Asaas) das lojas que se cadastram
          sozinhas em /cadastro.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Preço do plano</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Alterar aqui só afeta lojas novas — assinaturas já criadas no Asaas mantêm o valor
          travado no momento da assinatura. Toda loja tem {TRIAL_DAYS} dias grátis antes da 1ª
          cobrança.
        </p>
        <PlanPriceForm currentReais={settings.defaultPlanMonthlyCents / 100} />
      </section>
    </div>
  );
}
