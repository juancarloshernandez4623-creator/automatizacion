import { notFound } from "next/navigation";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { ChatPanel } from "./chat-panel";
import type { MessageBubbleData } from "@/components/chat/message-bubble";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, bot_active, contacts(id, full_name, wa_phone)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!conversation) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, direction, sender, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const contact = conversation.contacts as {
    id: string;
    full_name: string | null;
    wa_phone: string;
  } | null;

  const initialMessages: MessageBubbleData[] = (messages ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    direction: m.direction as MessageBubbleData["direction"],
    sender: m.sender as MessageBubbleData["sender"],
    createdAt: m.created_at,
  }));

  return (
    <ChatPanel
      conversationId={conversation.id}
      organizationId={organizationId}
      botActive={conversation.bot_active}
      contactName={contact?.full_name ?? null}
      contactPhone={contact?.wa_phone ?? ""}
      initialMessages={initialMessages}
    />
  );
}
