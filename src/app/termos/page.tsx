import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function TermosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold text-zinc-900">Termos de uso</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Texto de partida — revise com um(a) advogado(a) antes de publicar em produção.
        </p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">1. Sobre o serviço</h2>
            <p className="mt-2">
              O ZaapFood é uma plataforma que permite a lojas e restaurantes (&quot;Lojas&quot;) criar um
              cardápio digital e receber pedidos de seus clientes finais, incluindo integração
              com o WhatsApp. Ao criar uma conta, a Loja concorda com estes Termos de Uso.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">2. Cadastro e responsabilidades</h2>
            <p className="mt-2">
              A Loja é responsável pela veracidade dos dados informados no cadastro (incluindo
              CPF/CNPJ), pela exatidão do cardápio publicado, pelo cumprimento dos pedidos
              recebidos e por qualquer comunicação enviada a seus próprios clientes.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">3. Assinatura e cobrança</h2>
            <p className="mt-2">
              O uso da plataforma é cobrado por meio de uma mensalidade recorrente, processada
              via cartão de crédito ou PIX através de um provedor de pagamentos terceiro. O
              não pagamento pode resultar na suspensão temporária do acesso à conta.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">4. Uso aceitável</h2>
            <p className="mt-2">
              É proibido usar a plataforma para fins ilícitos, envio de mensagens não
              solicitadas (spam) ou qualquer atividade que viole direitos de terceiros.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">5. Alterações</h2>
            <p className="mt-2">
              Estes termos podem ser atualizados periodicamente. Mudanças relevantes serão
              comunicadas às Lojas cadastradas.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">6. Contato</h2>
            <p className="mt-2">
              Dúvidas sobre estes termos podem ser enviadas para o suporte da plataforma.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
