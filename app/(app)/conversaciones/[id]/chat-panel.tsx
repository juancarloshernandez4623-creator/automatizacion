"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneRight, Robot, Trash, WarningCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble, type MessageBubbleData } from "@/components/chat/message-bubble";
import { toggleBotActive, sendHumanMessage, type SendMessageActionState } from "./actions";
import { deleteConversation } from "../actions";

export function ChatPanel({
  conversationId,
  organizationId,
  botActive,
  contactName,
  contactPhone,
  initialMessages,
}: {
  conversationId: string;
  organizationId: string;
  botActive: boolean;
  contactName: string | null;
  contactPhone: string;
  initialMessages: MessageBubbleData[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isBotActive, setIsBotActive] = useState(botActive);
  const [isTogglePending, startToggleTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const boundSendHumanMessage = sendHumanMessage.bind(null, conversationId);
  const [state, formAction, isSending] = useActionState<SendMessageActionState, FormData>(
    boundSendHumanMessage,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setIsBotActive(botActive);
  }, [conversationId, initialMessages, botActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isSending && !state?.error) {
      formRef.current?.reset();
    }
  }, [isSending, state]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            content: string | null;
            direction: string;
            sender: string;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                content: row.content,
                direction: row.direction as MessageBubbleData["direction"],
                sender: row.sender as MessageBubbleData["sender"],
                createdAt: row.created_at,
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as { bot_active: boolean };
          setIsBotActive(row.bot_active);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, organizationId]);

  function handleToggle() {
    const next = !isBotActive;
    setIsBotActive(next);
    startToggleTransition(async () => {
      await toggleBotActive(conversationId, next);
    });
  }

  function handleDelete() {
    // Igual que en la lista (conversation-list.tsx): borrado real e
    // inmediato, con confirmacion porque no se puede deshacer. Si el
    // contacto vuelve a escribir, upsertConversation le crea una
    // conversacion nueva desde cero.
    if (!window.confirm("¿Eliminar esta conversación? Se borrará todo su historial. Si el cliente vuelve a escribir, se creará una conversación nueva.")) {
      return;
    }
    startDeleteTransition(async () => {
      await deleteConversation(conversationId);
      router.push("/conversaciones");
    });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-sm font-semibold text-neutral-900">
            {contactName || contactPhone}
          </h1>
          {contactName && <p className="text-xs text-neutral-400">{contactPhone}</p>}
        </div>

        {/* Pestaña/interruptor para intercalar entre respuesta automatica
            del agente y control humano directo -- mismo `bot_active` que ya
            resuelve el webhook antes de correr el agente, solo que aqui
            como un switch deslizante en vez del boton-pildora anterior. */}
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-medium ${isBotActive ? "text-brand-700" : "text-amber-700"}`}
          >
            {isBotActive ? "IA respondiendo" : "Control humano"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isBotActive}
            aria-label={
              isBotActive
                ? "Pausar el agente y tomar control humano"
                : "Reactivar la respuesta automática del agente"
            }
            onClick={handleToggle}
            disabled={isTogglePending}
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
              isBotActive ? "bg-brand-500" : "bg-amber-400"
            }`}
          >
            <span
              className={`absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
                isBotActive ? "translate-x-5" : "translate-x-0"
              }`}
            >
              <Robot
                size={11}
                weight="fill"
                className={isBotActive ? "text-brand-600" : "text-amber-500"}
              />
            </span>
          </button>

          <button
            type="button"
            aria-label="Eliminar conversación"
            disabled={isDeletePending}
            onClick={handleDelete}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash size={16} weight="bold" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 thin-scrollbar">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-400">Aún no hay mensajes.</p>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white px-5 py-3">
        {!isBotActive && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-amber-600">
            <WarningCircle size={13} weight="fill" />
            El bot está pausado en esta conversación — tus mensajes se envían como agente humano.
          </p>
        )}
        {state?.error && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-red-600">
            <WarningCircle size={13} weight="fill" />
            {state.error}
          </p>
        )}
        <form ref={formRef} action={formAction} className="flex items-end gap-2">
          <textarea
            name="text"
            rows={1}
            required
            placeholder="Escribe una respuesta…"
            className="max-h-32 flex-1 resize-none rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
          <button
            type="submit"
            disabled={isSending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-60"
            aria-label="Enviar"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </form>
      </div>
    </div>
  );
}
