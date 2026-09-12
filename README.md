# ZapFood

Plataforma que transforma o WhatsApp de uma loja em um canal de pedidos automatizado — inspirada no [foodzap.com.br](https://foodzap.com.br/): mensalidade fixa, sem comissão por pedido, painel de pedidos com impressão de comanda e cardápio digital com QR code.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Prisma 7** + **SQLite** (via driver adapter `@prisma/adapter-better-sqlite3`) — zero infraestrutura externa
- Autenticação própria (cookie assinado por HMAC + bcrypt), sem depender de Edge runtime
- **Server-Sent Events** para o painel de pedidos quase em tempo real
- **Vitest** (motor de conversa) + **Playwright** (fluxo ponta a ponta)

## Como rodar

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Acesse `http://localhost:3000`. Login de demonstração em `/admin/login`:

- **E-mail:** `dono@zapfood.demo`
- **Senha:** `zapfood123`

### Testes

```bash
npx vitest run          # motor de conversa (FSM), sem banco/navegador
npx playwright test     # fluxo completo com o navegador (requer `npm run dev` rodando)
```

## Arquitetura

### Multi-tenant

Cada loja (`Store`) tem seus próprios funcionários, categorias, produtos, clientes e pedidos. Toda consulta é filtrada por `storeId` vindo da sessão autenticada — nunca de um valor enviado pelo cliente. A única entrada sem sessão (o webhook do WhatsApp) resolve a loja casando o `phone_number_id` do payload da Meta com `Store.whatsappPhoneNumberId`.

### Motor de conversa do WhatsApp

O atendimento automático é uma máquina de estados **pura e testável** (`src/lib/engine/fsm.ts`): recebe o texto do cliente e o estado atual da conversa, devolve as próximas mensagens e o novo estado. Um orquestrador (`src/lib/engine/runTurn.ts`) faz a parte de I/O (buscar/salvar cliente, catálogo e estado no banco).

Esse motor é acionado por **dois transportes** que compartilham exatamente a mesma lógica de negócio:

1. **Webhook real** (`src/app/api/whatsapp/webhook/route.ts`) — no formato exato da Meta Cloud API (handshake de verificação via `GET`, mensagens via `POST`). Sempre responde `200` à Meta, mesmo em erro interno, para evitar retry storms.
2. **Simulador** (`/admin/simulator`, via `src/app/api/simulator/send/route.ts`) — permite testar uma conversa completa (escolher categoria, produto, quantidade, entrega, pagamento e confirmar) **sem nenhuma credencial real**, já que esta versão não tem acesso a um número de WhatsApp Business de verdade.

Fluxo da conversa: saudação → categoria → produto → quantidade → mais itens? → entrega ou retirada → endereço (se entrega) → forma de pagamento → confirmação → pedido criado. A qualquer momento, "menu" ou "cancelar" reinicia a conversa.

### Envio de mensagens

`src/lib/whatsapp/client.ts` envia mensagens via WhatsApp Cloud API (`graph.facebook.com`) quando a loja tem `whatsappToken`/`whatsappPhoneNumberId` configurados em **Configurações**. Sem credenciais, a mensagem é apenas logada no servidor — o código de produção fica pronto, mas testável sem depender da Meta.

### Painel de pedidos (Kanban) + tempo real

Pedidos são organizados por status (`RECEBIDO → EM_PREPARO → PRONTO → EM_ENTREGA → CONCLUÍDO`, com `CANCELADO` como saída alternativa). Uma mudança de pedido emite um evento em um `EventEmitter` em processo; a página do painel escuta via SSE (`/api/orders/stream`) e chama `router.refresh()`. **Limitação conhecida:** funciona apenas com uma única instância do servidor — um deploy com múltiplas instâncias precisaria de Redis pub/sub ou Postgres `LISTEN/NOTIFY`.

### Cardápio digital + QR code

Cada loja tem uma página pública somente-leitura em `/loja/[slug]`, com um carrinho simples no navegador que monta um link `https://wa.me/<numero>?text=...` com o pedido formatado — um segundo canal de pedido que não depende de credenciais da Cloud API. Em **Configurações**, a loja encontra o link e um QR code (gerado com a lib `qrcode`) para imprimir no balcão ou nas mesas.

## Limitações desta versão (por design)

- Sem verificação de assinatura do webhook (`X-Hub-Signature-256`) — recomendado antes de ir para produção.
- Sem gateway de pagamento real (o método de pagamento é só informativo no pedido).
- SSE funciona em processo único, como explicado acima.
- A conversa automática não pergunta por adicionais de produto (`ProductAddOn` existe no schema e no admin de catálogo, mas o fluxo do WhatsApp ainda não usa) — corte de escopo deliberado.
- Nenhuma API não-oficial (tipo Venom-bot/whatsapp-web.js, que conecta via QR code sem aprovação da Meta) foi usada, por risco real de banimento da conta — a integração usa exclusivamente o formato oficial da Cloud API.

## Referências

- [foodzap.com.br](https://foodzap.com.br/) — modelo/inspiração principal do produto.
- [dhiogoboza/pedidoszapp](https://github.com/dhiogoboza/pedidoszapp), [DevSamurai/food-gpt](https://github.com/DevSamurai/food-gpt) e [Israelkilday/KIMININUS_PIZZA_DELIVERY](https://github.com/Israelkilday/KIMININUS_PIZZA_DELIVERY) — inspiração complementar para o cardápio digital com QR code e para o link `wa.me` de pedido rápido.
