"use client";

import { useState, type ChangeEvent } from "react";

export function ImageUploadField({
  name,
  kind,
  label,
  initialUrl,
  aspect = "square",
}: {
  name: string;
  kind: "logo" | "cover" | "product" | "option";
  label: string;
  initialUrl?: string | null;
  aspect?: "square" | "banner";
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Falha ao enviar imagem.");
        return;
      }
      setUrl(json.url);
    } catch {
      setError("Falha de conexão ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  const previewClass = aspect === "banner" ? "h-24 w-full sm:w-56 object-cover" : "h-20 w-20 object-cover";

  return (
    <div>
      <span className="block text-sm font-medium text-zinc-700">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className={`rounded-lg border border-zinc-200 ${previewClass}`} />
        ) : (
          <div
            className={`flex items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400 ${previewClass}`}
          >
            Sem imagem
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100">
            {uploading ? "Enviando..." : url ? "Trocar imagem" : "Enviar imagem"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-xs text-red-600 hover:underline"
            >
              Remover
            </button>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
