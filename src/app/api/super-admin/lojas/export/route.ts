import { NextResponse } from "next/server";
import { requirePlatformSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

// Exporta só o CADASTRO de cada loja (dados da própria empresa cliente da
// ZaapFood) — nunca dados internos dela (clientes finais, cardápio,
// pedidos/vendas), que pertencem à loja, não à plataforma.
export async function GET() {
  await requirePlatformSession();

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    include: { staff: { where: { role: "OWNER" }, take: 1 } },
  });

  const header = [
    "Nome da loja",
    "Slug",
    "Categoria",
    "Dono(a)",
    "E-mail",
    "CPF/CNPJ",
    "Telefone/WhatsApp",
    "Endereço",
    "Cidade",
    "UF",
    "CEP",
    "Status",
    "Mensalidade",
    "Criada em",
  ];

  const rows = stores.map((store) => {
    const owner = store.staff[0];
    const address = [store.addressStreet, store.addressNumber, store.addressComplement, store.addressNeighborhood]
      .filter(Boolean)
      .join(", ");
    return [
      store.name,
      store.slug,
      store.category ?? "",
      owner?.name ?? "",
      owner?.email ?? "",
      store.cnpjCpf ?? "",
      store.whatsappContactPhone ?? "",
      address,
      store.addressCity ?? "",
      store.addressState ?? "",
      store.addressZip ?? "",
      store.active ? "Ativa" : "Inativa",
      formatCents(store.planMonthlyCents ?? 0),
      store.createdAt.toLocaleDateString("pt-BR"),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lojas-cadastradas.csv"`,
    },
  });
}
