import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function PrivacidadePage() {
  return (
    <div className="flex flex-1 flex-col">
      <MarketingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold text-zinc-900">Política de privacidade</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Texto de partida — revise com um(a) advogado(a) antes de publicar em produção.
        </p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">1. Dados que coletamos</h2>
            <p className="mt-2">
              Coletamos os dados informados no cadastro da Loja (nome, e-mail, CPF/CNPJ,
              telefone) e, quando o cliente final opta por criar uma conta no cardápio digital,
              nome, telefone, endereço e um PIN de acesso (armazenado apenas como hash).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">2. Como usamos os dados</h2>
            <p className="mt-2">
              Os dados são usados para operar a plataforma: processar pedidos, calcular taxas
              de entrega, emitir cobranças da assinatura e permitir que a Loja entre em contato
              com seus próprios clientes. Não vendemos dados a terceiros.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">3. Compartilhamento</h2>
            <p className="mt-2">
              Dados de pagamento são compartilhados com o provedor de cobrança (Asaas) apenas
              para processar a assinatura. Cada Loja só tem acesso aos dados dos próprios
              clientes e pedidos — nunca aos de outra Loja da plataforma.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">4. Segurança</h2>
            <p className="mt-2">
              Senhas e PINs são armazenados com hash criptográfico, nunca em texto puro.
              Sessões de acesso usam cookies assinados e não podem ser forjadas pelo navegador.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">5. Direitos do titular</h2>
            <p className="mt-2">
              Qualquer pessoa pode solicitar a exclusão ou correção de seus dados entrando em
              contato com a Loja onde fez o cadastro ou diretamente com o suporte da plataforma.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
