import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { BenefitsList } from "@/components/marketing/BenefitsList";
import { SavingsCalculator } from "@/components/marketing/SavingsCalculator";
import { Testimonials } from "@/components/marketing/Testimonials";
import { PricingCta } from "@/components/marketing/PricingCta";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getPlatformSettings } from "@/lib/platformSettings";

// Sem isso, o Next.js pré-renderiza a home como página estática no build,
// "congelando" o preço no valor de quando rodou o build — precisa ser
// dinâmica pra sempre refletir o valor atual configurado em
// /super-admin/configuracoes.
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getPlatformSettings();
  const priceCents = settings.defaultPlanMonthlyCents;

  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <BenefitsList />
        <SavingsCalculator priceCents={priceCents} />
        <Testimonials />
        <PricingCta priceCents={priceCents} />
      </main>
      <MarketingFooter />
    </div>
  );
}
