import QRCode from "qrcode";
import { requireSession, requireAnyPermission, hasPermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, ROLE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/domain";
import { getStoreMenuUrl, getWhatsappWebhookUrl } from "@/lib/storeUrl";
import { CopyableCode } from "@/components/admin/CopyableCode";
import { WEEKDAY_LABELS, defaultOpeningHours, parseOpeningHours } from "@/lib/openingHours";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { formatCents } from "@/lib/money";
import { getPlatformSettings } from "@/lib/platformSettings";
import { SubscriptionCheckoutButton } from "./SubscriptionCheckoutButton";
import { TestWhatsappConnectionButton } from "./TestWhatsappConnectionButton";
import { TeamManagement } from "./TeamManagement";
import { DeliveryZoneManager } from "./DeliveryZoneManager";
import {
  updateWhatsappSettingsAction,
  updateCompanyInfoAction,
  updateBrandingAction,
  updateOpeningHoursAction,
  updateDeliverySettingsAction,
  updatePixKeyAction,
  createStaffAction,
} from "./actions";

export default async function SettingsPage() {
  const session = await requireSession();
  requireAnyPermission(session, ["finance", "settings"]);
  const canFinance = hasPermission(session, "finance");
  const canSettings = hasPermission(session, "settings");
  const isOwner = session.role === "OWNER";

  const [store, staff, deliveryZones, platformSettings] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: session.storeId } }),
    prisma.staff.findMany({ where: { storeId: session.storeId }, orderBy: { createdAt: "asc" } }),
    prisma.deliveryZone.findMany({ where: { storeId: session.storeId }, orderBy: { neighborhood: "asc" } }),
    getPlatformSettings(),
  ]);

  const menuUrl = getStoreMenuUrl(store.slug);
  const webhookUrl = getWhatsappWebhookUrl();
  const qrDataUrl = await QRCode.toDataURL(menuUrl, { margin: 1, width: 220 });
  const openingHours = parseOpeningHours(store.openingHoursJson) ?? defaultOpeningHours();
  const monthlyCents = store.planMonthlyCents ?? platformSettings.defaultPlanMonthlyCents;
  const isTrialActive = !!store.trialEndsAt && store.trialEndsAt > new Date();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-zinc-900">Configurações</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-6">
          {canSettings && (
          <>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Dados da loja</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Nome, identidade visual e dados cadastrais usados pela ZaapFood.
            </p>
            <form action={updateCompanyInfoAction} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Nome da loja</label>
                <input
                  name="name"
                  defaultValue={store.name}
                  required
                  className="mt-1 w-full max-w-md rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">CPF ou CNPJ</label>
                <input
                  name="cnpjCpf"
                  defaultValue={store.cnpjCpf ?? ""}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label className="block text-sm font-medium text-zinc-700">Rua</label>
                  <input
                    name="addressStreet"
                    defaultValue={store.addressStreet ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700">Número</label>
                  <input
                    name="addressNumber"
                    defaultValue={store.addressNumber ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700">Complemento</label>
                  <input
                    name="addressComplement"
                    defaultValue={store.addressComplement ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700">Bairro</label>
                  <input
                    name="addressNeighborhood"
                    defaultValue={store.addressNeighborhood ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700">Cidade</label>
                  <input
                    name="addressCity"
                    defaultValue={store.addressCity ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-zinc-700">UF</label>
                  <input
                    name="addressState"
                    maxLength={2}
                    defaultValue={store.addressState ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700">CEP</label>
                  <input
                    name="addressZip"
                    defaultValue={store.addressZip ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Salvar
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="text-sm font-medium text-zinc-700">Identidade visual</p>
              <p className="mt-1 text-sm text-zinc-500">
                Logo e capa aparecem no topo do seu cardápio digital.
              </p>
              <form action={updateBrandingAction} className="mt-4 flex flex-col gap-6">
                <ImageUploadField name="logoUrl" kind="logo" label="Logo" initialUrl={store.logoUrl} />
                <ImageUploadField
                  name="coverImageUrl"
                  kind="cover"
                  label="Capa"
                  initialUrl={store.coverImageUrl}
                  aspect="banner"
                />
                <button
                  type="submit"
                  className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Salvar
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Recebimento via PIX</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Com a chave preenchida, a comanda impressa de pedidos pagos por PIX já sai com um QR
              code pronto, com o valor do pedido preenchido — o cliente só escaneia e paga.
            </p>
            <form action={updatePixKeyAction} className="mt-4 flex flex-col gap-4">
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-zinc-700">Chave PIX</label>
                <input
                  name="pixKey"
                  defaultValue={store.pixKey ?? ""}
                  placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              {!store.addressCity && (
                <p className="text-xs text-amber-600">
                  Preencha a Cidade em &quot;Dados da loja&quot; acima também — é obrigatória pro QR
                  do PIX funcionar.
                </p>
              )}
              <button
                type="submit"
                className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Salvar
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Horário de funcionamento</h2>
            <p className="mt-1 text-sm text-zinc-500">
              O cardápio mostra automaticamente se a loja está aberta agora.
            </p>
            <form action={updateOpeningHoursAction} className="mt-4 flex flex-col gap-3">
              {WEEKDAY_LABELS.map((label, day) => (
                <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex w-40 items-center gap-2">
                    <input
                      type="checkbox"
                      name={`enabled-${day}`}
                      defaultChecked={!openingHours[day].closed}
                      className="rounded border-zinc-300"
                    />
                    {label}
                  </label>
                  <input
                    type="time"
                    name={`open-${day}`}
                    defaultValue={openingHours[day].open}
                    className="rounded-lg border border-zinc-300 px-2 py-1 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-zinc-400">até</span>
                  <input
                    type="time"
                    name={`close-${day}`}
                    defaultValue={openingHours[day].close}
                    className="rounded-lg border border-zinc-300 px-2 py-1 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="mt-2 self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Salvar
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Cardápio digital</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Compartilhe este link ou imprima o QR code no balcão e nas mesas — o cliente pede sem
              precisar instalar nada.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR code do cardápio digital"
                className="h-40 w-40 rounded-lg border border-zinc-200"
              />
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium text-brand-dark hover:underline"
              >
                {menuUrl}
              </a>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">WhatsApp</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  store.whatsappConnectionOk
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                Status: {store.whatsappConnectionOk ? "Conectado" : "Não conectado"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              O <strong>número de contato</strong> é só o número que aparece pro seu cliente clicar e
              abrir uma conversa no cardápio — qualquer número de WhatsApp já funciona pra isso, sem
              configuração nenhuma. As <strong>credenciais da Cloud API</strong> (os 3 campos abaixo)
              são o que liga o atendimento e as notificações automáticas de verdade — enquanto elas
              estiverem em branco, o sistema continua funcionando normalmente, só que as mensagens
              ficam registradas no simulador (<code className="rounded bg-zinc-100 px-1">/admin/simulator</code>) em vez de saírem pelo WhatsApp de verdade.
            </p>

            <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 open:pb-5">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                Como conseguir as credenciais da Cloud API (passo a passo)
              </summary>
              <ol className="mt-4 flex flex-col gap-4 text-sm text-zinc-700">
                <li>
                  <p className="font-medium text-zinc-900">1. Crie uma conta comercial no Facebook</p>
                  <p className="mt-0.5 text-zinc-600">
                    Se ainda não tiver, acesse{" "}
                    <span className="font-medium">business.facebook.com</span> e crie um Gerenciador
                    de Negócios com o nome da sua loja.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-zinc-900">2. Crie um app no Meta for Developers</p>
                  <p className="mt-0.5 text-zinc-600">
                    Acesse <span className="font-medium">developers.facebook.com/apps</span>, clique
                    em &quot;Criar app&quot;, escolha o tipo <span className="font-medium">Empresa</span>{" "}
                    e vincule ao Gerenciador de Negócios do passo 1.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-zinc-900">3. Adicione o produto WhatsApp ao app</p>
                  <p className="mt-0.5 text-zinc-600">
                    Dentro do app criado, procure <span className="font-medium">WhatsApp</span> na
                    lista de produtos e clique em &quot;Configurar&quot;.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-zinc-900">4. Cadastre o número da sua loja</p>
                  <p className="mt-0.5 text-zinc-600">
                    Na tela &quot;Configuração da API&quot;, clique em &quot;Adicionar número de
                    telefone&quot; e siga a verificação por SMS ou ligação.{" "}
                    <span className="font-medium">
                      Use um número que não esteja instalado no app comum do WhatsApp
                    </span>{" "}
                    — um número não pode estar nos dois ao mesmo tempo.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-zinc-900">5. Gere um token de acesso permanente</p>
                  <p className="mt-0.5 text-zinc-600">
                    O token que aparece de primeira expira em 24h. Vá em Configurações do Negócio →
                    Usuários do sistema, crie um usuário do sistema, dê acesso ao app criado, e gere um
                    token <span className="font-medium">sem data de expiração</span> com a permissão{" "}
                    <code className="rounded bg-white px-1 py-0.5">whatsapp_business_messaging</code>.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-zinc-900">6. Configure o Webhook</p>
                  <p className="mt-0.5 text-zinc-600">
                    Ainda no app, vá em WhatsApp → Configuração → Webhook → Editar, e preencha:
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">URL de retorno de chamada</p>
                  <CopyableCode value={webhookUrl} />
                  <p className="mt-2 text-xs font-medium text-zinc-500">Token de verificação</p>
                  <p className="mt-0.5 text-zinc-600">
                    Invente uma senha qualquer (ex: uma sequência de letras e números) e digite ela
                    aqui — não vem pronta da Meta. Depois de salvar lá, cole essa{" "}
                    <span className="font-medium">mesma senha</span> no campo &quot;Verify Token&quot;
                    logo abaixo. Por fim, inscreva-se no campo{" "}
                    <code className="rounded bg-white px-1 py-0.5">messages</code>.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-zinc-900">7. Cole tudo nos campos abaixo e salve</p>
                  <p className="mt-0.5 text-zinc-600">
                    O &quot;Identificador do número de telefone&quot; (Phone Number ID) aparece na
                    mesma tela do passo 4.
                  </p>
                </li>
              </ol>
              <p className="mt-4 text-xs text-zinc-400">
                As telas da Meta mudam de vez em quando — se algum nome estiver diferente, procure a
                opção equivalente. Qualquer dúvida, fale com quem administra a plataforma.
              </p>
            </details>

            <form action={updateWhatsappSettingsAction} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Número de WhatsApp da loja
                </label>
                <input
                  name="whatsappContactPhone"
                  defaultValue={store.whatsappContactPhone ?? ""}
                  placeholder="+5511999999999"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Phone Number ID (Cloud API)
                </label>
                <input
                  name="whatsappPhoneNumberId"
                  defaultValue={store.whatsappPhoneNumberId ?? ""}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">WABA ID</label>
                <input
                  name="whatsappWabaId"
                  defaultValue={store.whatsappWabaId ?? ""}
                  placeholder="ID da conta comercial do WhatsApp"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Access Token</label>
                <input
                  name="whatsappToken"
                  type="password"
                  defaultValue={store.whatsappToken ?? ""}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Verify Token</label>
                <input
                  name="whatsappVerifyToken"
                  defaultValue={store.whatsappVerifyToken ?? ""}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Salvar
                </button>
              </div>
            </form>
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <TestWhatsappConnectionButton />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Entrega</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Cadastre um valor por bairro — o sistema aplica automaticamente quando o cliente
              informa o endereço. Bairros fora da lista usam a taxa padrão.
            </p>
            <form action={updateDeliverySettingsAction} className="mt-4 flex flex-col gap-4">
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-zinc-700">Taxa padrão (R$)</label>
                <input
                  name="deliveryFeeReais"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(store.deliveryFeeCents / 100).toFixed(2)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Usada quando o bairro do cliente não está na lista abaixo.
                </p>
              </div>
              <button
                type="submit"
                className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Salvar taxa padrão
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="text-sm font-medium text-zinc-700">Catálogo de bairros</p>
              <div className="mt-3">
                <DeliveryZoneManager zones={deliveryZones} />
              </div>
            </div>
          </section>
          </>
          )}
        </div>

        {canFinance && (
        <aside className="lg:sticky lg:top-8">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900">Assinatura da plataforma</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Mensalidade de {formatCents(monthlyCents)} cobrada automaticamente no cartão ou PIX
              cadastrado.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  store.paymentStatus === "INADIMPLENTE"
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {PAYMENT_STATUS_LABELS[store.paymentStatus as "EM_DIA" | "INADIMPLENTE"] ??
                  store.paymentStatus}
              </span>
            </div>
            {isTrialActive && (
              <p className="mt-2 text-xs text-zinc-500">
                Teste grátis até {store.trialEndsAt!.toLocaleDateString("pt-BR")}
              </p>
            )}
            {!store.asaasCustomerId && (
              <p className="mt-2 text-xs text-amber-600">Forma de pagamento ainda não configurada.</p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <SubscriptionCheckoutButton hasSubscription={!!store.asaasSubscriptionId} />
              {store.asaasSubscriptionId && (
                <p className="text-xs text-zinc-400">
                  Use &quot;Gerenciar assinatura&quot; acima também para atualizar a forma de
                  pagamento.
                </p>
              )}
            </div>
          </section>
        </aside>
        )}
      </div>

      {isOwner && (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h2 className="text-lg font-semibold text-zinc-900">Equipe</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Clique num membro pra escolher o cargo e quais páginas do painel ele acessa.
        </p>

        <div className="mt-4">
          <TeamManagement members={staff} />
        </div>

        <form
          action={createStaffAction}
          className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-6"
        >
          <h3 className="text-sm font-semibold text-zinc-700">Adicionar membro da equipe</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <input
              name="name"
              placeholder="Nome"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha provisória"
              required
              minLength={6}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <select
              name="role"
              defaultValue={STAFF_ROLES[0]}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Adicionar
          </button>
        </form>
      </section>
      )}
    </div>
  );
}
