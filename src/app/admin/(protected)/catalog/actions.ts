"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/guards";

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório."),
});

export async function createCategoryAction(formData: FormData) {
  const session = await requireSession();
  const { name } = categorySchema.parse({ name: formData.get("name") });
  const sortOrder = await prisma.category.count({ where: { storeId: session.storeId } });
  await prisma.category.create({ data: { storeId: session.storeId, name, sortOrder } });
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const session = await requireSession();
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

function extractAddOns(formData: FormData) {
  const names = formData.getAll("addOnName") as string[];
  const prices = formData.getAll("addOnPrice") as string[];
  const addOns: { name: string; priceCents: number }[] = [];
  names.forEach((name, index) => {
    const trimmed = name.trim();
    const priceValue = Number(prices[index]);
    if (trimmed && Number.isFinite(priceValue) && priceValue >= 0) {
      addOns.push({ name: trimmed, priceCents: Math.round(priceValue * 100) });
    }
  });
  return addOns;
}

async function assertOwnCategory(storeId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, storeId } });
  if (!category) throw new Error("Categoria inválida.");
  return category;
}

export async function createProductAction(formData: FormData) {
  const session = await requireSession();
  const parsed = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceReais: formData.get("priceReais"),
    categoryId: formData.get("categoryId"),
    imageUrl: formData.get("imageUrl") || "",
  });

  const category = await assertOwnCategory(session.storeId, parsed.categoryId);
  const sortOrder = await prisma.product.count({ where: { categoryId: category.id } });
  const addOns = extractAddOns(formData);

  await prisma.product.create({
    data: {
      storeId: session.storeId,
      categoryId: category.id,
      name: parsed.name,
      description: parsed.description || undefined,
      priceCents: Math.round(parsed.priceReais * 100),
      imageUrl: parsed.imageUrl || undefined,
      sortOrder,
      addOns: addOns.length ? { create: addOns } : undefined,
    },
  });

  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireSession();
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
  const addOns = extractAddOns(formData);

  await prisma.productAddOn.deleteMany({ where: { productId } });
  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      priceCents: Math.round(parsed.priceReais * 100),
      imageUrl: parsed.imageUrl || null,
      categoryId: category.id,
      active,
      addOns: addOns.length ? { create: addOns } : undefined,
    },
  });

  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}

export async function deleteProductAction(productId: string) {
  const session = await requireSession();
  await prisma.product.deleteMany({ where: { id: productId, storeId: session.storeId } });
  revalidatePath("/admin/catalog");
  redirect("/admin/catalog");
}
