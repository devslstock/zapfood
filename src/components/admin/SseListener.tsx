"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Escuta o stream SSE de mudanças de pedidos e atualiza a página atual.
// Reconecta automaticamente se a conexão cair.
export function SseListener() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/orders/stream");
    source.onmessage = () => {
      router.refresh();
    };
    return () => source.close();
  }, [router]);

  return null;
}
