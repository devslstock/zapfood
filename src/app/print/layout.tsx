import type { ReactNode } from "react";

export default function PrintLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-zinc-100 py-10 text-black print:bg-white print:py-0">{children}</div>;
}
