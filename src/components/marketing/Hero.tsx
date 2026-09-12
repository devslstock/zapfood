import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand-dark">
            Pedidos automáticos pelo WhatsApp
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Transforme o WhatsApp da sua loja numa máquina de pedidos
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
            O ZapFood atende seus clientes automaticamente no WhatsApp, organiza os pedidos
            num painel de cozinha e imprime a comanda — com mensalidade fixa e{" "}
            <strong className="text-zinc-900">sem comissão por pedido</strong>, ao contrário
            do iFood, Rappi ou Uber Eats.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/cadastro"
              className="rounded-full bg-brand px-6 py-3 text-center text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              Quero contratar o ZapFood
            </Link>
            <a
              href="#como-funciona"
              className="rounded-full border border-zinc-300 px-6 py-3 text-center text-base font-semibold text-zinc-700 transition hover:border-zinc-400"
            >
              Ver como funciona
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Sem cartão de crédito. Cadastro leva menos de 2 minutos.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-[2.5rem] border-8 border-zinc-900 bg-zinc-900 shadow-2xl">
            <div className="overflow-hidden rounded-[2rem] bg-[#e5ddd5]">
              <div className="flex items-center gap-2 bg-brand-dark px-4 py-3 text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  SM
                </span>
                <div>
                  <p className="text-sm font-semibold">Sorveteria da Maria</p>
                  <p className="text-xs text-white/80">online</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4 text-sm">
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow">
                  Olá! 👋 Bem-vindo(a). Vamos montar seu pedido.
                  <br />
                  Escolha uma categoria:
                  <br />
                  1. Sorvetes
                  <br />
                  2. Milk-shakes
                </div>
                <div className="ml-auto max-w-[70%] rounded-lg rounded-tr-none bg-emerald-100 px-3 py-2 shadow">
                  1
                </div>
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow">
                  1. Casquinha de Chocolate - R$ 8,00
                  <br />
                  2. Copo 2 Bolas - R$ 12,00
                </div>
                <div className="ml-auto max-w-[70%] rounded-lg rounded-tr-none bg-emerald-100 px-3 py-2 shadow">
                  Pedido #7 confirmado! 🎉
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
