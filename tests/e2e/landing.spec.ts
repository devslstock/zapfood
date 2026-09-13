import { test, expect } from "@playwright/test";

test("landing page mostra hero e calculadora de economia", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /máquina de pedidos/i })
  ).toBeVisible();
  await expect(page.getByText(/Calcule quanto você economiza/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Quero contratar o ZaapFood/i }).first()
  ).toBeVisible();
});
