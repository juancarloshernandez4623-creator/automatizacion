import type { ModelMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const HISTORY_LIMIT = 20;

/**
 * Reconstruye el historial de una conversacion como `ModelMessage[]` para
 * pasarselo a `generateText`. Es una reconstruccion TEXTUAL simple (no
 * persiste tool-calls entre invocaciones): cada webhook entrante dispara un
 * nuevo loop de agente que relee la transcripcion como texto plano. Es
 * suficiente para el flujo conversacional de la spec y evita tener que
 * serializar/deserializar el formato interno de tool-calls de la SDK entre
 * requests sin estado.
 */
export async function loadConversationHistory(
  admin: SupabaseClient<Database>,
  conversationId: string,
): Promise<ModelMessage[]> {
  const { data, error } = await admin
    .from("messages")
    .select("sender, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error || !data) {
    return [];
  }

  return data
    .slice()
    .reverse()
    .filter((m) => Boolean(m.content))
    .map((m): ModelMessage => ({
      role: m.sender === "contact" ? "user" : "assistant",
      content: m.content as string,
    }));
}
