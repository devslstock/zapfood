import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";

const bodySchema = z.object({
  phone: z.string().trim().min(8),
  pin: z.string().trim().regex(/^\d{4}$/),
});

// Login simplificado usado no checkout do cardápio digital pra "puxar" nome
// e endereços salvos de quem já criou conta antes — escopado por loja
// (mesma pessoa pode ter contas independentes em lojas diferentes) e sempre
// com erro genérico em caso de falha, pra não revelar se um telefone existe.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Telefone ou senha incorretos." }, { status: 401 });
  }

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
  }

  const phone = parsed.data.phone.replace(/\D/g, "");
  const customer = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId: store.id, phone } },
    include: { addresses: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer || !customer.pinHash || !(await verifyPassword(parsed.data.pin, customer.pinHash))) {
    return NextResponse.json({ error: "Telefone ou senha incorretos." }, { status: 401 });
  }

  return NextResponse.json({
    name: customer.name,
    addresses: customer.addresses.map((address) => ({
      id: address.id,
      address: address.address,
      addressLat: address.addressLat,
      addressLng: address.addressLng,
    })),
  });
}
