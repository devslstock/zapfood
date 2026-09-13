import "server-only";

// Supabase Storage via REST, sem SDK — mesmo estilo do cliente do WhatsApp e
// do e-mail (fetch direto). Requer um bucket público criado no painel do
// Supabase (Storage → New bucket → Public bucket) com o nome de
// SUPABASE_STORAGE_BUCKET.
export async function uploadImage(params: {
  buffer: Buffer;
  contentType: string;
  path: string;
}): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "zaapfood-assets";

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Envio de imagem não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env."
    );
  }

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${params.path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": params.contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(params.buffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao enviar imagem (${response.status}): ${errorText}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${params.path}`;
}
