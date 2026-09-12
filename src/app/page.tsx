import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { BenefitsList } from "@/components/marketing/BenefitsList";
import { SavingsCalculator } from "@/components/marketing/SavingsCalculator";
import { Testimonials } from "@/components/marketing/Testimonials";
import { PricingCta } from "@/components/marketing/PricingCta";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <BenefitsList />
        <SavingsCalculator />
        <Testimonials />
        <PricingCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
