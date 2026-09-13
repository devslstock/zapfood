import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireSession, requirePermission } from "@/lib/auth/guards";
import { uploadImage } from "@/lib/storage/upload";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const KIND_FOLDERS = { logo: "logo", cover: "cover", product: "products", option: "options" } as const;

export async function POST(request: NextRequest) {
  const session = await requireSession();
  requirePermission(session, "products");

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (typeof kind !== "string" || !(kind in KIND_FOLDERS)) {
    return NextResponse.json({ error: "Tipo de imagem inválido." }, { status: 400 });
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Formato não suportado (use JPG, PNG, WEBP ou GIF)." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Imagem maior que 5MB." }, { status: 400 });
  }

  const filename = `${randomBytes(8).toString("hex")}.${extension}`;
  const path = `stores/${session.storeId}/${KIND_FOLDERS[kind as keyof typeof KIND_FOLDERS]}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadImage({ buffer, contentType: file.type, path });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao enviar imagem." },
      { status: 500 }
    );
  }
}
