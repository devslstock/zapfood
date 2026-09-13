"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePermission } from "@/lib/auth/guards";

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
});

export async function createCategoryAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "products");
  const { name } = categorySchema.parse({ name: formData.get("name") });
  const sortOrder = await prisma.category.count({ where: { storeId: session.storeId } });
  await prisma.category.create({ data: { storeId: session.storeId, name, sortOrder } });
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "products");
  const { name } = categorySchema.parse({ name: formData.get("name") });
  const active = formData.get("active") === "on";
  await prisma.category.updateMany({
    where: { id: categoryId, storeId: session.storeId },
    data: { name, active },
  });
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await requireSession();
  requirePermission(session, "products");
  await prisma.category.deleteMany({ where: { id: categoryId, storeId: session.storeId } });
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
  description: z.string().optional(),
  priceReais: z.coerce.number().positive("Preço deve ser maior que zero."),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

type OptionGroupInput = {
  name: string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: { name: string; priceCents: number; imageUrl?: string; sortOrder: number }[];
};

function extractOptionGroups(formData: FormData): OptionGroupInput[] {
  const groupKeys = formData.getAll("groupKey") as string[];
  const groupNames = formData.getAll("groupName") as string[];
  const groupMins = formData.getAll("groupMin") as string[];
  const groupMaxs = formData.getAll("groupMax") as string[];

  const optionGroupKeys = formData.getAll("optionGroupKey") as string[];
  const optionNames = formData.getAll("optionName") as string[];
  const optionPrices = formData.getAll("optionPrice") as string[];
  const optionImageUrls = formData.getAll("optionImageUrl") as string[];

  const groupsByKey = new Map<string, OptionGroupInput>();

  groupKeys.forEach((key, index) => {
    const name = groupNames[index]?.trim();
    if (!name) return;
    groupsByKey.set(key, {
      name,
      minSelect: Math.max(0, Number(groupMins[index]) || 0),
      maxSelect: Math.max(1, Number(groupMaxs[index]) || 1),
      sortOrder: index,
      options: [],
    });
  });

  optionGroupKeys.forEach((groupKey, index) => {
    const group = groupsByKey.get(groupKey);
    if (!group) return;
    const name = optionNames[index]?.trim();
    const priceValue = Number(optionPrices[index]);
    if (!name || !Number.isFinite(priceValue) || priceValue < 0) return;
    const imageUrl = optionImageUrls[index]?.trim();
    group.options.push({
      name,
      priceCents: Math.round(priceValue * 100),
      imageUrl: imageUrl || undefined,
      sortOrder: group.options.length,
    });
  });

  return Array.from(groupsByKey.values());
}

async function assertOwnCategory(storeId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, storeId } });
  if (!category) throw new Error("Categoria inválida.");
  return category;
}

export async function createProductAction(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "products");
  const parsed = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceReais: formData.get("priceReais"),
    categoryId: formData.get("categoryId"),
    imageUrl: formData.get("imageUrl") || "",
  });

  const category = await assertOwnCategory(session.storeId, parsed.categoryId);
  const sortOrder = await prisma.product.count({ where: { categoryId: category.id } });
  const optionGroups = extractOptionGroups(formData);

  await prisma.product.create({
    data: {
      storeId: session.storeId,
      categoryId: category.id,
      name: parsed.name,
      description: parsed.description || undefined,
      priceCents: Math.round(parsed.priceReais * 100),
      imageUrl: parsed.imageUrl || undefined,
      sortOrder,
      optionGroups: optionGroups.length
        ? {
            create: optionGroups.map((group) => ({
              name: group.name,
              minSelect: group.minSelect,
              maxSelect: group.maxSelect,
              sortOrder: group.sortOrder,
              options: { create: group.options },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "products");
  const parsed = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceReais: formData.get("priceReais"),
    categoryId: formData.get("categoryId"),
    imageUrl: formData.get("imageUrl") || "",
  });
  const active = formData.get("active") === "on";

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: session.storeId },
  });
  if (!product) throw new Error("Produto não encontrado.");

  const category = await assertOwnCategory(session.storeId, parsed.categoryId);
  const optionGroups = extractOptionGroups(formData);

  await prisma.productOptionGroup.deleteMany({ where: { productId } });
  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      priceCents: Math.round(parsed.priceReais * 100),
      imageUrl: parsed.imageUrl || null,
      categoryId: category.id,
      active,
      optionGroups: optionGroups.length
        ? {
            create: optionGroups.map((group) => ({
              name: group.name,
              minSelect: group.minSelect,
              maxSelect: group.maxSelect,
              sortOrder: group.sortOrder,
              options: { create: group.options },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function deleteProductAction(productId: string) {
  const session = await requireSession();
  requirePermission(session, "products");
  await prisma.product.deleteMany({ where: { id: productId, storeId: session.storeId } });
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

// Reordena por arrastar-e-soltar no painel — `orderedIds` já vem na ordem
// final desejada, e o sortOrder de cada linha vira o índice na lista.
export async function reorderCategoriesAction(orderedIds: string[]): Promise<{ ok: boolean }> {
  const session = await requireSession();
  requirePermission(session, "products");

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.updateMany({
        where: { id, storeId: session.storeId },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath("/admin/catalog");
  return { ok: true };
}

export async function reorderProductsAction(
  categoryId: string,
  orderedIds: string[]
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  requirePermission(session, "products");
  await assertOwnCategory(session.storeId, categoryId);

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.product.updateMany({
        where: { id, storeId: session.storeId, categoryId },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath("/admin/catalog");
  return { ok: true };
}
