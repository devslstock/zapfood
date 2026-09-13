import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "dono@zaapfood.demo";
const DEMO_PASSWORD = "zaapfood123";

test.describe.configure({ mode: "serial" });

test("fluxo completo: login, catálogo, pedido pelo simulador, kanban e impressão", async ({
  page,
}) => {
  const suffix = Date.now();
  const categoryName = `Categoria Teste ${suffix}`;
  const productName = `Produto Teste ${suffix}`;
  let categoryChoiceIndex = 0;
  let orderId = "";

  await test.step("login", async () => {
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill(DEMO_EMAIL);
    await page.getByLabel("Senha").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: /Olá, Maria Souza/ })).toBeVisible();
  });

  await test.step("criar categoria", async () => {
    await page.goto("/admin/catalog");
    categoryChoiceIndex = (await page.locator("section").count()) + 1;

    await page.getByRole("link", { name: "Nova categoria" }).click();
    await page.getByLabel("Nome").fill(categoryName);
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/admin\/catalog$/);
    await expect(page.getByRole("heading", { name: categoryName })).toBeVisible();
  });

  await test.step("criar produto na categoria nova", async () => {
    const section = page.locator("section", { hasText: categoryName });
    await section.getByRole("link", { name: "+ Produto" }).click();

    await expect(page).toHaveURL(/\/admin\/catalog\/products\/new/);
    await page.getByLabel("Nome").fill(productName);
    await page.getByLabel("Preço (R$)").fill("12.50");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/admin\/catalog$/);
    await expect(page.getByText(productName)).toBeVisible();
  });

  await test.step("editar produto", async () => {
    const row = page.locator("li", { hasText: productName });
    await row.getByRole("link", { name: "Editar" }).click();
    const editedDescription = `Descrição editada via teste e2e ${suffix}`;
    await page.getByLabel("Descrição (opcional)").fill(editedDescription);
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/\/admin\/catalog$/);
    await expect(page.getByText(editedDescription)).toBeVisible();
  });

  await test.step("fazer pedido completo pelo simulador de WhatsApp", async () => {
    await page.goto("/admin/simulator");
    const input = page.getByPlaceholder("Digite uma mensagem...");
    const sendButton = page.getByRole("button", { name: "Enviar" });

    async function sendMessage(text: string) {
      await input.fill(text);
      await sendButton.click();
      await expect(input).toHaveValue("");
    }

    await sendMessage("oi");
    await expect(page.getByText(categoryName)).toBeVisible();

    await sendMessage(String(categoryChoiceIndex));
    await expect(page.getByText(productName)).toBeVisible();

    await sendMessage("1"); // escolhe o produto (único nesta categoria)
    await sendMessage("2"); // quantidade
    await sendMessage("2"); // não quer mais itens, finalizar
    await sendMessage("2"); // retirada
    await sendMessage("3"); // pix
    await sendMessage("1"); // confirmar

    const confirmation = page.getByText(/Pedido #\d+ confirmado!/);
    await expect(confirmation).toBeVisible();
    const text = await confirmation.textContent();
    const match = text?.match(/Pedido #(\d+) confirmado/);
    orderId = match?.[1] ?? "";
    expect(orderId).not.toBe("");
  });

  await test.step("pedido aparece no painel com o total correto", async () => {
    await page.goto(`/admin/orders/${orderId}`);
    await expect(page.getByRole("heading", { name: `Pedido #${orderId}` })).toBeVisible();
    await expect(page.getByText("Recebido", { exact: true })).toBeVisible();
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText(/R\$\s*25,00/).first()).toBeVisible();
  });

  await test.step("avança o status do pedido", async () => {
    await page.getByRole("button", { name: "Em preparo" }).click();
    await expect(page.getByText("Em preparo", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Pronto" }).click();
    await expect(page.getByText("Pronto", { exact: true })).toBeVisible();
  });

  await test.step("imprime a comanda", async () => {
    await page.goto(`/print/orders/${orderId}`);
    await expect(page.getByText(`Pedido #${orderId}`)).toBeVisible();
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByText(/R\$\s*25,00/).first()).toBeVisible();
  });
});
