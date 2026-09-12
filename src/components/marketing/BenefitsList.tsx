const BENEFITS = [
  {
    title: "Sem comissão por pedido",
    description:
      "Mensalidade fixa, não importa quantos pedidos sua loja receber. Nada de perder 12-27% do faturamento em taxas.",
  },
  {
    title: "Atendimento automático 24/7",
    description:
      "Um assistente conversa com o cliente no WhatsApp, monta o carrinho e confirma o pedido sozinho.",
  },
  {
    title: "Painel de pedidos e impressão",
    description:
      "Acompanhe pedidos em tempo real num quadro por status e imprima a comanda para a cozinha em um clique.",
  },
  {
    title: "Cardápio digital com QR code",
    description:
      "Gere um QR code do seu cardápio para imprimir no balcão ou nas mesas — o cliente pede sem precisar instalar nada.",
  },
  {
    title: "Sem app concorrendo com você",
    description:
      "Seus clientes continuam falando com a sua loja, no WhatsApp que já usam todos os dias.",
  },
  {
    title: "Capacidade multiplicada",
    description:
      "Atenda muito mais clientes ao mesmo tempo sem precisar contratar mais gente para o telefone.",
  },
];

export function BenefitsList() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Tudo que sua loja precisa para vender pelo WhatsApp
        </h2>
        <p className="mt-4 text-lg text-zinc-600">
          Inspirado no que já funciona para centenas de sorveterias, hamburguerias e pastelarias
          pelo Brasil.
        </p>
      </div>
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
              ✓
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">{benefit.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
