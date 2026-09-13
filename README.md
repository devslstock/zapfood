# ZaapFood

Plataforma que transforma o WhatsApp de uma loja em um canal de pedidos automatizado — inspirada no [foodzap.com.br](https://foodzap.com.br/): mensalidade fixa, sem comissão por pedido, painel de pedidos com impressão de comanda e cardápio digital com QR code.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Prisma 7** + **PostgreSQL** (via driver adapter `@prisma/adapter-pg`)
- Autenticação própria (cookie assinado por HMAC + bcrypt), sem depender de Edge runtime
- **Server-Sent Events** para o painel de pedidos quase em tempo real
- **Vitest** (motor de conversa) + **Playwright** (fluxo ponta a ponta)

## Como rodar

Requer um PostgreSQL rodando (local ou hospedado — Vercel Postgres/Neon/Supabase funcionam).

```bash
npm install
cp .env.example .env   # ajuste DATABASE_URL para o seu Postgres
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Acesse `http://localhost:3000`. Login de demonstração em `/admin/login`:

- **E-mail:** `dono@zaapfood.demo`
- **Senha:** `zaapfood123`

### Painel da plataforma (super-admin)

Além do painel de cada loja, existe um painel interno em `/super-admin` para quem opera a
ZaapFood gerenciar todas as lojas clientes: ativar/desativar (ex: inadimplência), situação
financeira e mensalidade, dados cadastrais (CPF/CNPJ, endereço) e reset de senha do dono(a).
Não é acessível a partir do painel de nenhuma loja — é uma conta à parte, criada pelo seed:

- **E-mail:** `admin@zaapfood.app` (ou o valor de `PLATFORM_ADMIN_EMAIL`)
- **Senha:** `zaapfood-admin123` (ou o valor de `PLATFORM_ADMIN_PASSWORD`)

### Testes

```bash
npx vitest run          # motor de conversa (FSM), sem banco/navegador
npx playwright test     # fluxo completo com o navegador (requer `npm run dev` rodando)
```

## Deploy na Vercel

1. Crie um banco Postgres (ex: aba **Storage** do próprio projeto na Vercel, que provisiona via Neon; ou Neon/Supabase direto).
2. Configure as variáveis de ambiente do projeto na Vercel (Settings → Environment Variables):
   - `DATABASE_URL` — connection string do Postgres.
   - `SESSION_SECRET` — um valor aleatório forte (`openssl rand -hex 32`).
   - `NEXT_PUBLIC_APP_URL` — a URL pública do deploy (ex: `https://seu-projeto.vercel.app`).
   - `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN` — opcionais, só necessários para credenciais globais de fallback.
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — opcionais; sem a API key, o e-mail de confirmação de cadastro só é logado no servidor em vez de enviado de verdade.
   - `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` / `PLATFORM_ADMIN_NAME` — credenciais da conta de super-admin, criada pelo `prisma db seed` se ainda não existir.
3. Pronto — o script `build` já roda `prisma migrate deploy` antes do `next build`, então as migrations são aplicadas automaticamente a cada deploy (e `postinstall` já roda `prisma generate`).

### Um link por loja (subdomínio)

Por padrão cada loja usa `seusite.com/loja/[slug]`. Para dar a cada cliente seu próprio link
(`<slug-da-loja>.zaapfood.com`), depois de comprar o domínio:

1. Na Vercel, adicione o domínio coringa `*.zaapfood.com` ao projeto (Settings → Domains), além do
   `zaapfood.com` normal — a Vercel mostra o registro DNS a criar (geralmente um `CNAME *`).
2. Configure a env var `ROOT_DOMAIN=zaapfood.com` (sem `https://`, sem `www`).
3. Pronto — `src/proxy.ts` identifica o subdomínio da requisição e serve o cardápio daquela loja
   automaticamente; `/admin`, `/cadastro` e `/super-admin` continuam só no domínio raiz. Sem
   `ROOT_DOMAIN`, nada muda — o link por caminho (`/loja/[slug]`) continua funcionando normalmente.

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

Cada loja tem uma página pública em `/loja/[slug]` no estilo de um app de delivery: capa + logo
sobrepostos, selo "Aberto agora"/"Fechado" calculado a partir do horário configurado
(`Store.openingHoursJson`, editável em **Configurações** — ver `src/lib/openingHours.ts`), menu de
categorias fixo no topo (rolagem para a seção) e produtos em grade com foto. Clicar num produto
abre o detalhe com descrição e, se configurados, grupos de sabores/adicionais (`ProductOptionGroup`
+ `ProductOption` — `minSelect`/`maxSelect` definem obrigatório e escolha única/múltipla, inspirado
no modelo de catálogo do iFood) antes de adicionar ao carrinho.

No checkout, o cliente monta o pedido, informa entrega/retirada e finaliza direto pela página
(`/api/loja/[slug]/checkout`) — cria um pedido de verdade (mesmo caminho usado pelo motor de
conversa do WhatsApp, aparece no Kanban) e dispara uma confirmação automática pelo WhatsApp do
cliente. Preço e validade dos complementos são sempre recalculados no servidor, nunca confiando no
que o cliente enviou. Para entrega, o endereço é por CEP (autocompletado via ViaCEP, API pública
gratuita) com confirmação da localização num mapa Leaflet/OpenStreetMap (geocodificado via
Nominatim, pino arrastável) antes de finalizar — as coordenadas ficam salvas no pedido
(`Order.addressLat/addressLng`) com um link "Ver no mapa" no painel do admin. O link
`https://wa.me/<numero>?text=...` com o pedido pré-formatado continua disponível como alternativa
manual. Em **Configurações**, a loja encontra o link e um QR code (gerado com a lib `qrcode`) para
imprimir no balcão ou nas mesas.

Fotos de produto, logo e capa são enviadas direto na tela (sem precisar de link) via **Supabase
Storage** (`src/lib/storage/upload.ts`, rota `/api/admin/upload`) — requer `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` no `.env` e um bucket público criado no painel do Supabase; sem isso,
o envio de imagem retorna um erro claro na tela em vez de travar o resto do cardápio.

### Cadastro, confirmação de e-mail e papéis da equipe

O cadastro público (`/cadastro`) cria a loja e o(a) dono(a) (`role: OWNER`), mas não libera sessão
na hora: envia um e-mail de confirmação (`src/lib/email/`) e só cria a sessão quando o link é
acessado (`/api/auth/verify-email`) — sem RESEND_API_KEY configurada, o link fica só no log do
servidor. O(a) dono(a) pode convidar equipe em **Configurações** com papéis específicos (Balcão,
Cozinheiro(a), Caixa, Entregador(a) — ver `ROLES`/`ROLE_LABELS` em `src/lib/domain.ts`); esses
membros já entram com acesso liberado, sem precisar confirmar e-mail.

### Painel da plataforma (super-admin)

`/super-admin` é uma área separada (sessão e login próprios, `PlatformAdmin`/`PlatformSession`)
para quem opera a ZaapFood — não é acessível por nenhuma loja. Lista todas as lojas clientes e
permite: ativar/desativar (`Store.active`, usado em casos de inadimplência — bloqueia login do
admin, cardápio público e webhook do WhatsApp da loja), editar situação financeira/mensalidade
(`Store.paymentStatus`/`planMonthlyCents`), editar dados cadastrais (CPF/CNPJ e endereço) e gerar
uma nova senha provisória para o(a) dono(a) da loja.

### Cobrança automática (Asaas)

O cadastro público (`/cadastro`) cria a assinatura recorrente sozinho, sem controle manual do
super-admin: cria um cliente e uma assinatura mensal no [Asaas](https://www.asaas.com) (`src/lib/asaas/client.ts`)
com `TRIAL_DAYS` (7) dias grátis antes da 1ª cobrança, e redireciona para a fatura hospedada do
Asaas — o cliente escolhe cartão, PIX ou boleto por lá, sem o ZaapFood nunca ver dado de cartão.
O preço do plano único é definido pelo super-admin em `/super-admin/configuracoes`
(`PlatformSettings.defaultPlanMonthlyCents`) — mudar lá só afeta assinaturas novas.

O webhook em `/api/webhooks/asaas` recebe os eventos de cobrança e atualiza `Store.active`/
`paymentStatus` sozinho (pago → ativa/EM_DIA, atrasado → desativada/INADIMPLENTE), substituindo o
botão manual do super-admin no dia a dia — ele continua disponível para casos excepcionais.
Para funcionar:

1. Configure `ASAAS_API_KEY` (pegue em Asaas → Integrações → API) e `ASAAS_BASE_URL` no `.env`
   (uma chave `$aact_hmlg_...` é de sandbox — nada é cobrado de verdade; troque para produção
   quando for ao ar).
2. Gere um valor aleatório para `ASAAS_WEBHOOK_SECRET` e cadastre a URL
   `https://SEU-DOMINIO/api/webhooks/asaas` em Asaas → Integrações → Webhooks, colando o mesmo
   valor no campo "Token de autenticação" — o Asaas não alcança `localhost`, então isso só
   funciona depois do deploy (ou com um túnel tipo ngrok, para testar antes disso).

Se a criação da assinatura falhar no cadastro (CPF inválido, Asaas fora do ar), a conta é criada
normalmente do mesmo jeito — o(a) dono(a) pode configurar/tentar de novo a qualquer momento em
**Configurações → Assinatura**.

## Limitações desta versão (por design)

- Sem verificação de assinatura do webhook do WhatsApp (`X-Hub-Signature-256`) — recomendado antes de ir para produção. O webhook do Asaas já usa um token compartilhado (`ASAAS_WEBHOOK_SECRET`).
- Assinatura recorrente via Asaas cobre cartão/PIX/boleto pela fatura hospedada; não há parcelamento nem planos múltiplos — plano único por enquanto.
- SSE funciona em processo único, como explicado acima.
- Nenhuma API não-oficial (tipo Venom-bot/whatsapp-web.js, que conecta via QR code sem aprovação da Meta) foi usada, por risco real de banimento da conta — a integração usa exclusivamente o formato oficial da Cloud API.
- Sem provedor de e-mail configurado, o Resend tende a só entregar e-mails para o próprio endereço da conta (modo sandbox) até um domínio ser verificado — suficiente para testar o fluxo, mas checar isso antes de abrir cadastro para clientes reais.
- CPF/CNPJ não passa por validação de dígito verificador, só checagem de tamanho (11 ou 14 dígitos).
- ViaCEP (busca de endereço) e Nominatim/OpenStreetMap (geocodificação do mapa) são APIs públicas
  gratuitas de terceiros, sem chave — não têm SLA garantido e Nominatim pede uso moderado (ok para
  o volume de uma loja, mas não para tráfego alto).
- O motor de conversa do WhatsApp ainda não pergunta sabores/adicionais (`ProductOptionGroup`
  existe no schema e no admin/cardápio digital, mas só o checkout web usa) — corte de escopo
  deliberado.

## Referências

- [foodzap.com.br](https://foodzap.com.br/) — modelo/inspiração principal do produto.
- [dhiogoboza/pedidoszapp](https://github.com/dhiogoboza/pedidoszapp), [DevSamurai/food-gpt](https://github.com/DevSamurai/food-gpt) e [Israelkilday/KIMININUS_PIZZA_DELIVERY](https://github.com/Israelkilday/KIMININUS_PIZZA_DELIVERY) — inspiração complementar para o cardápio digital com QR code e para o link `wa.me` de pedido rápido.
