import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;

const UNIQUE_VIOLATION = "23505";

/**
 * Crea el contacto si no existe; si ya existe y no tenia `full_name`, lo
 * completa con el nombre de perfil que WhatsApp manda en `contacts[].profile.name`
 * (no lo pisa si el contacto ya tenia un nombre, ej. guardado manualmente
 * por save_contact_info).
 */
export async function upsertContact(
  admin: AdminClient,
  params: { organizationId: string; waPhone: string; contactName: string | null },
): Promise<string> {
  const { organizationId, waPhone, contactName } = params;

  const { data: existing } = await admin
    .from("contacts")
    .select("id, full_name")
    .eq("organization_id", organizationId)
    .eq("wa_phone", waPhone)
    .maybeSingle();

  if (existing) {
    if (!existing.full_name && contactName) {
      await admin.from("contacts").update({ full_name: contactName }).eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: inserted, error } = await admin
    .from("contacts")
    .insert({ organization_id: organizationId, wa_phone: waPhone, full_name: contactName })
    .select("id")
    .single();

  if (error || !inserted) {
    throw error ?? new Error("No se pudo crear el contacto");
  }

  return inserted.id;
}

/**
 * Crea la conversacion si no existe (con bot_active=true por default) o
 * actualiza `last_message_at` si ya existia. Devuelve el estado actual de
 * `bot_active`, que el caller usa para decidir si invoca al agente.
 */
export async function upsertConversation(
  admin: AdminClient,
  params: { organizationId: string; contactId: string },
): Promise<{ id: string; botActive: boolean }> {
  const { organizationId, contactId } = params;

  const { data: existing } = await admin
    .from("conversations")
    .select("id, bot_active")
    .eq("organization_id", organizationId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id);
    return { id: existing.id, botActive: existing.bot_active };
  }

  const { data: inserted, error } = await admin
    .from("conversations")
    .insert({ organization_id: organizationId, contact_id: contactId })
    .select("id, bot_active")
    .single();

  if (error || !inserted) {
    throw error ?? new Error("No se pudo crear la conversacion");
  }

  return { id: inserted.id, botActive: inserted.bot_active };
}

/**
 * Inserta el mensaje entrante. Si `wa_message_id` ya existe (Meta reenvio el
 * mismo evento dentro de su ventana de reintentos de hasta 7 dias), la
 * unique constraint de la migracion 0009 lanza un error Postgres 23505, que
 * aqui se traduce a `alreadyProcessed: true` en vez de propagar el error --
 * es la garantia de idempotencia pedida en la spec.
 */
export async function insertInboundMessage(
  admin: AdminClient,
  params: {
    conversationId: string;
    organizationId: string;
    waMessageId: string;
    content: string;
    raw: Json;
  },
): Promise<{ alreadyProcessed: boolean }> {
  const { error } = await admin.from("messages").insert({
    conversation_id: params.conversationId,
    organization_id: params.organizationId,
    wa_message_id: params.waMessageId,
    direction: "inbound",
    sender: "contact",
    content: params.content,
    raw: params.raw,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { alreadyProcessed: true };
    }
    throw error;
  }

  return { alreadyProcessed: false };
}

export async function insertOutboundMessage(
  admin: AdminClient,
  params: {
    conversationId: string;
    organizationId: string;
    waMessageId: string | null;
    content: string;
    sender: "bot" | "human";
  },
): Promise<void> {
  const { error } = await admin.from("messages").insert({
    conversation_id: params.conversationId,
    organization_id: params.organizationId,
    wa_message_id: params.waMessageId,
    direction: "outbound",
    sender: params.sender,
    content: params.content,
  });

  if (error) {
    throw error;
  }
}
