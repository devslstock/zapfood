import { test, expect } from "@playwright/test";

test("cardápio digital monta link do WhatsApp com o pedido", async ({ page }) => {
  await page.goto("/loja/sorveteria-da-maria");
  await expect(page.getByRole("heading", { name: "Sorveteria da Maria" })).toBeVisible();

  await page.getByRole("button", { name: /Adicionar Casquinha de Chocolate/ }).click();

  const link = page.getByRole("link", { name: "Pedir pelo WhatsApp" });
  await expect(link).toBeVisible();

  const href = await link.getAttribute("href");
  expect(href).toContain("https://wa.me/5511988887777");
  expect(decodeURIComponent(href ?? "")).toContain("Casquinha de Chocolate");
});
