import { SlDevFooter } from "@/components/SlDevFooter";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 sm:flex-row">
        <p>© {new Date().getFullYear()} ZaapFood. Todos os direitos reservados.</p>
        <p>Feito para pequenos negócios de comida venderem mais pelo WhatsApp.</p>
      </div>
      <SlDevFooter />
    </footer>
  );
}
