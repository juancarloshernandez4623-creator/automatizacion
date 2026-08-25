import { requireCurrentOrg } from "@/lib/auth/current-org";
import { ConversationList, type ConversationListItem } from "./conversation-list";

/**
 * Layout compartido de /conversaciones: lista a la izquierda (fija, se
 * actualiza en tiempo real via Supabase Realtime dentro de
 * ConversationList), detalle a la derecha via `children`
 * (app/(app)/conversaciones/page.tsx cuando no hay ninguna seleccionada, o
 * app/(app)/conversaciones/[id]/page.tsx con el chat abierto).
 */
export default async function ConversacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, bot_active, last_message_at, contacts(full_name, wa_phone)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false })
    .limit(100);

  const conversationIds = (conversations ?? []).map((c) => c.id);

  const { data: recentMessages } = conversationIds.length
    ? await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(conversationIds.length * 3)
    : { data: [] };

  const lastMessageByConversation = new Map<string, string>();
  for (const message of recentMessages ?? []) {
    if (!lastMessageByConversation.has(message.conversation_id) && message.content) {
      lastMessageByConversation.set(message.conversation_id, message.content);
    }
  }

  const items: ConversationListItem[] = (conversations ?? []).map((c) => {
    const contact = c.contacts as { full_name: string | null; wa_phone: string } | null;
    return {
      id: c.id,
      botActive: c.bot_active,
      lastMessageAt: c.last_message_at,
      lastMessagePreview: lastMessageByConversation.get(c.id) ?? "",
      contactName: contact?.full_name ?? null,
      contactPhone: contact?.wa_phone ?? "",
    };
  });

  return (
    <div className="flex h-full">
      <ConversationList organizationId={organizationId} initialConversations={items} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
