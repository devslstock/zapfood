const TESTIMONIALS = [
  {
    initials: "GS",
    name: "Gelateria Stella",
    city: "Campinas, SP",
    quote:
      "Antes eu perdia pedido porque não dava conta de responder o WhatsApp na correria. Agora o atendimento automático nunca deixa ninguém esperando.",
  },
  {
    initials: "BH",
    name: "Burger House do Zé",
    city: "Sorocaba, SP",
    quote:
      "Parei de pagar comissão pros aplicativos e o pedido cai direto na cozinha, já impresso. Economizei muito mais do que esperava.",
  },
  {
    initials: "PN",
    name: "Pastelaria Nordestina",
    city: "Ribeirão Preto, SP",
    quote:
      "Coloquei o QR code do cardápio no balcão e as pessoas pedem direto pelo celular. Simplificou demais o nosso dia a dia.",
  },
];

export function Testimonials() {
  return (
    <section id="depoimentos" className="bg-zinc-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Quem usa, recomenda
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Histórias ilustrativas de lojas que resolveram o atendimento pelo WhatsApp.
          </p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100"
            >
              <blockquote className="text-sm leading-relaxed text-zinc-700">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-dark">
                  {testimonial.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{testimonial.name}</p>
                  <p className="text-xs text-zinc-500">{testimonial.city}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
