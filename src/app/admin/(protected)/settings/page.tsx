import QRCode from "qrcode";
import { requireSession, requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  updateWhatsappSettingsAction,
  createStaffAction,
  deleteStaffAction,
} from "./actions";

export default async function SettingsPage() {
  const session = await requireSession();
  requireRole(session, "OWNER");

  const [store, staff] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: session.storeId } }),
    prisma.staff.findMany({ where: { storeId: session.storeId }, orderBy: { createdAt: "asc" } }),
  ]);

  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/loja/${store.slug}`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, { margin: 1, width: 220 });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-zinc-900">Configurações</h1>

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
        <h2 className="text-lg font-semibold text-zinc-900">WhatsApp</h2>
        <p className="mt-1 text-sm text-zinc-500">
          O número de contato é usado no cardápio digital. As credenciais da Cloud API ativam o
          atendimento automático de verdade — deixe em branco para continuar testando só pelo
          simulador.
        </p>
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
          <button
            type="submit"
            className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h2 className="text-lg font-semibold text-zinc-900">Equipe</h2>
        <ul className="mt-4 divide-y divide-zinc-100">
          {staff.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{member.name}</p>
                <p className="text-zinc-500">
                  {member.email} · {member.role === "OWNER" ? "Dono(a)" : "Equipe"}
                </p>
              </div>
              {member.role !== "OWNER" && (
                <form action={deleteStaffAction.bind(null, member.id)}>
                  <button type="submit" className="font-medium text-red-600 hover:underline">
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        <form
          action={createStaffAction}
          className="mt-6 flex flex-col gap-4 border-t border-zinc-100 pt-6"
        >
          <h3 className="text-sm font-semibold text-zinc-700">Adicionar membro da equipe</h3>
          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Adicionar
          </button>
        </form>
      </section>
    </div>
  );
}
