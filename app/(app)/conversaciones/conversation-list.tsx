"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PauseCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export type ConversationListItem = {
  id: string;
  botActive: boolean;
  lastMessageAt: string;
  lastMessagePreview: string;
  contactName: string | null;
  contactPhone: string;
};

function initials(name: string | null, phone: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return phone.slice(-2);
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} d`;
}

export function ConversationList({
  organizationId,
  initialConversations,
}: {
  organizationId: string;
  initialConversations: ConversationListItem[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const activeId = params?.id;

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`org-conversations:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // No tenemos el nombre/telefono del contacto en el payload de
            // Realtime (no hace join); pedirle al servidor la lista
            // completa de nuevo es lo mas simple para el caso raro de una
            // conversacion totalmente nueva llegando mientras el dashboard
            // esta abierto.
            router.refresh();
            return;
          }
          const updated = payload.new as { id: string; bot_active: boolean; last_message_at: string };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === updated.id
                ? { ...c, botActive: updated.bot_active, lastMessageAt: updated.last_message_at }
                : c,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const message = payload.new as { conversation_id: string; content: string | null };
          if (!message.content) return;
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === message.conversation_id
                ? { ...c, lastMessagePreview: message.content as string }
                : c,
            );
            return next.sort(
              (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
            );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, router]);

  const sorted = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      ),
    [conversations],
  );

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-y-auto border-r border-neutral-200 bg-white thin-scrollbar">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-900">Conversaciones</h2>
      </div>

      {sorted.length === 0 && (
        <p className="p-4 text-sm text-neutral-400">
          Aun no hay conversaciones. Aparecerán aquí en cuanto un cliente escriba por WhatsApp.
        </p>
      )}

      <ul>
        {sorted.map((c) => (
          <li key={c.id}>
            <Link
              href={`/conversaciones/${c.id}`}
              className={`flex items-center gap-3 border-b border-neutral-100 px-4 py-3 transition hover:bg-neutral-50 ${
                activeId === c.id ? "bg-brand-50" : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initials(c.contactName, c.contactPhone)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-neutral-900">
                    {c.contactName || c.contactPhone}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {relativeTime(c.lastMessageAt)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-neutral-500">
                    {c.lastMessagePreview || "Sin mensajes"}
                  </span>
                  {!c.botActive && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      <PauseCircle size={11} weight="fill" />
                      Bot pausado
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
