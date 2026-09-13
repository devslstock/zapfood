"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePlatformSession } from "@/lib/auth/guards";
import { updateDefaultPlanMonthlyCents } from "@/lib/platformSettings";

const schema = z.object({
  priceReais: z.coerce.number().positive("O valor deve ser maior que zero."),
});

export type PlatformSettingsState = { error?: string; success?: boolean };

export async function updateDefaultPlanAction(
  _prevState: PlatformSettingsState,
  formData: FormData
): Promise<PlatformSettingsState> {
  await requirePlatformSession();

  const parsed = schema.safeParse({ priceReais: formData.get("priceReais") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Valor inválido." };
  }

  await updateDefaultPlanMonthlyCents(Math.round(parsed.data.priceReais * 100));
  revalidatePath("/super-admin/configuracoes");
  return { success: true };
}
