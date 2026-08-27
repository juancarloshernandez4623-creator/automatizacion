"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentOrg } from "@/lib/auth/current-org";

export type DeleteConversationResult = { error?: string };

/**
 * Elimina una conversacion (y en cascada sus mensajes, via la FK de
 * `messages.conversation_id` -- migracion 0009) como en WhatsApp: es un
 * borrado real, no un archivado. Si ese mismo contacto vuelve a escribir mas
 * tarde, `upsertConversation` (lib/whatsapp/persist-message.ts) no encuentra
 * ninguna fila existente para el (organization_id, contact_id) y crea una
 * conversacion nueva desde cero -- no hace falta ningun cambio ahi, es el
 * comportamiento natural de ese upsert una vez que la fila vieja ya no esta.
 */
export async function deleteConversation(conversationId: string): Promise<DeleteConversationResult> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: "No se pudo eliminar la conversación." };
  }

  revalidatePath("/conversaciones");
  return {};
}
