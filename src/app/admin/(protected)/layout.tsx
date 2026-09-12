import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/guards";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { SseListener } from "@/components/admin/SseListener";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50">
      <AdminTopNav session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <SseListener />
    </div>
  );
}
