"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePermission } from "@/lib/auth/guards";
import { getEvolutionWebhookUrl } from "@/lib/storeUrl";
import {
  createEvolutionInstance,
  getEvolutionQrCode,
  getEvolutionConnectionState,
  deleteEvolutionInstance,
} from "@/lib/evolution/client";

export type StartEvolutionConnectionState =
  | { ok: true; qrCodeDataUrl: string | null }
  | { ok: false; error: string };

// Cria a instance na 1ª vez (gerando nome + token de webhook) ou busca um QR
// novo se a instance já existe (ex: QR expirou antes de escanear). Exige
// aceite explícito do aviso de risco antes de falar com a Evolution API pela
// 1ª vez — validado aqui no servidor, não só pelo checkbox do client.
export async function startEvolutionConnectionAction(
  riskAccepted: boolean
): Promise<StartEvolutionConnectionState> {
  const session = await requireSession();
  requirePermission(session, "settings");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.storeId } });

  if (!store.evolutionRiskAcceptedAt && !riskAccepted) {
    return { ok: false, error: "É preciso aceitar o aviso de risco antes de conectar." };
  }

  try {
    if (!store.evolutionInstanceName) {
      const instanceName = `store-${store.id}`;
      const webhookToken = randomBytes(24).toString("hex");
      await prisma.store.update({
        where: { id: store.id },
        data: {
          evolutionInstanceName: instanceName,
          evolutionWebhookToken: webhookToken,
          evolutionRiskAcceptedAt: store.evolutionRiskAcceptedAt ?? new Date(),
        },
      });

      const { qrCodeDataUrl } = await createEvolutionInstance(
        instanceName,
        getEvolutionWebhookUrl(instanceName, webhookToken)
      );
      revalidatePath("/admin/settings");
      return { ok: true, qrCodeDataUrl };
    }

    if (!store.evolutionRiskAcceptedAt) {
      await prisma.store.update({
        where: { id: store.id },
        data: { evolutionRiskAcceptedAt: new Date() },
      });
    }

    const { qrCodeDataUrl } = await getEvolutionQrCode(store.evolutionInstanceName);
    revalidatePath("/admin/settings");
    return { ok: true, qrCodeDataUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível conectar à Evolution API.",
    };
  }
}

export type CheckEvolutionConnectionState = { state: "open" | "close" | "connecting" | "unknown" };

// Complemento ao webhook CONNECTION_UPDATE (útil em dev local sem URL
// pública, ou se o webhook simplesmente atrasar) — a UI chama isso em
// polling enquanto espera o scan do QR.
export async function checkEvolutionConnectionStatusAction(): Promise<CheckEvolutionConnectionState> {
  const session = await requireSession();
  requirePermission(session, "settings");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.storeId } });
  if (!store.evolutionInstanceName) return { state: "unknown" };

  const state = await getEvolutionConnectionState(store.evolutionInstanceName);

  if (state === "open" && store.whatsappProvider !== "EVOLUTION") {
    await prisma.store.update({
      where: { id: store.id },
      data: { whatsappProvider: "EVOLUTION", whatsappConnectionOk: true, whatsappLastTestedAt: new Date() },
    });
    revalidatePath("/admin/settings");
  }

  return { state };
}

export type DisconnectEvolutionState = { ok: boolean; error?: string };

export async function disconnectEvolutionAction(): Promise<DisconnectEvolutionState> {
  const session = await requireSession();
  requirePermission(session, "settings");

  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.storeId } });
  if (!store.evolutionInstanceName) return { ok: true };

  try {
    await deleteEvolutionInstance(store.evolutionInstanceName);
  } catch (error) {
    // Best-effort: a instance pode já não existir mais do lado da Evolution —
    // segue limpando o lado do ZaapFood de qualquer forma.
    console.error("[evolution] falha ao apagar instance remotamente", error);
  }

  await prisma.store.update({
    where: { id: store.id },
    data: {
      evolutionInstanceName: null,
      evolutionWebhookToken: null,
      whatsappConnectionOk: null,
      whatsappLastTestedAt: null,
      whatsappProvider: store.whatsappProvider === "EVOLUTION" ? "META" : store.whatsappProvider,
    },
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
