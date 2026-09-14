import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SseListener } from "@/components/admin/SseListener";
import { SlDevFooter } from "@/components/SlDevFooter";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row">
      <AdminSidebar session={session} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex-1">{children}</div>
        <SlDevFooter />
      </main>
      <SseListener />
    </div>
  );
}
