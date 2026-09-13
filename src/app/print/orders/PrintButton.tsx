"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-6 w-full rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark print:hidden"
    >
      Imprimir
    </button>
  );
}
