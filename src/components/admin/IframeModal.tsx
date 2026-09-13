"use client";

export function IframeModal({
  url,
  onClose,
  title,
}: {
  url: string;
  onClose: () => void;
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">{title ?? "Visualizar"}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>
        <iframe src={url} title={title ?? "Visualizar"} className="flex-1 border-0" />
      </div>
    </div>
  );
}
