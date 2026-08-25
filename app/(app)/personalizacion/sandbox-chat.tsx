"use client";

import { useEffect, useRef, useState } from "react";
import { PaperPlaneRight, Robot, User, WarningCircle } from "@phosphor-icons/react";
import type { AgentConfigFormValues } from "@/lib/types";

type SandboxMessage = { role: "user" | "assistant"; content: string };

export function SandboxChat({ agentConfig }: { agentConfig: AgentConfigFormValues }) {
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setError(null);
    const nextHistory: SandboxMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/agent/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfig, history: nextHistory }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "El agente no pudo responder.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.replyText }]);
    } catch {
      setError("No se pudo conectar con el agente. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">Probar agente</h3>
        <p className="text-xs text-neutral-400">
          Simula una conversación con los cambios actuales (aún no guardados). No agenda citas reales.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 thin-scrollbar">
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-neutral-400">
            Escribe como si fueras un cliente para ver cómo respondería el agente.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`flex max-w-[85%] items-start gap-1.5 ${m.role === "user" ? "" : "flex-row-reverse"}`}>
                <span className="mt-0.5 shrink-0 text-neutral-400">
                  {m.role === "user" ? <User size={14} /> : <Robot size={14} />}
                </span>
                <div
                  className={`whitespace-pre-wrap rounded-xl px-3 py-1.5 text-sm ${
                    m.role === "user" ? "bg-neutral-100 text-neutral-900" : "bg-brand-500 text-white"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {isSending && <p className="text-xs text-neutral-400">El agente está escribiendo…</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 border-t border-neutral-100 px-4 py-2 text-xs text-red-600">
          <WarningCircle size={13} weight="fill" />
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-neutral-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hola, quisiera agendar una cita…"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
          aria-label="Enviar"
        >
          <PaperPlaneRight size={16} weight="fill" />
        </button>
      </form>
    </div>
  );
}
