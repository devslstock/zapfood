"use client";

import { useState } from "react";

type ChatMessage = { from: "cliente" | "loja"; text: string };

function randomPhone(): string {
  const digits = Math.floor(100000000 + Math.random() * 899999999);
  return `+5511${digits}`;
}

export function SimulatorChat() {
  const [phone, setPhone] = useState(() => randomPhone());
  const [customerName, setCustomerName] = useState("Cliente Teste");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    setError(null);
    setMessages((prev) => [...prev, { from: "cliente", text }]);
    setInput("");
    setSending(true);
    try {
      const response = await fetch("/api/simulator/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text, customerName }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao enviar mensagem.");
      }
      const data: { messages: string[] } = await response.json();
      setMessages((prev) => [
        ...prev,
        ...data.messages.map((message) => ({ from: "loja" as const, text: message })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSending(false);
    }
  }

  function resetConversation() {
    setPhone(randomPhone());
    setMessages([]);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500">Telefone do cliente</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">Nome do cliente</label>
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <button
          type="button"
          onClick={resetConversation}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Novo cliente
        </button>
      </div>

      <div className="flex h-[28rem] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-[#e5ddd5]">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-500">
              Envie &quot;oi&quot; para começar a conversa, como um cliente faria no WhatsApp.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.from === "cliente"
                    ? "ml-auto max-w-[80%] whitespace-pre-wrap rounded-lg rounded-tr-none bg-emerald-100 px-3 py-2 text-sm shadow"
                    : "max-w-[80%] whitespace-pre-wrap rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm shadow"
                }
              >
                {message.text}
              </div>
            ))}
          </div>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2 border-t border-zinc-200 bg-white p-3"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
