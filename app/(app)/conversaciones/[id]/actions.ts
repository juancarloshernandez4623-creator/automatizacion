"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { decrypt } from "@/lib/crypto";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import { insertOutboundMessage } from "@/lib/whatsapp/persist-message";

export type SendMessageActionState = { error?: string } | null;

/**
 * Prende/apaga el bot para una conversacion puntual. Al apagarlo, el
 * webhook deja de invocar al agente para esos mensajes entrantes (ver
 * app/api/webhooks/whatsapp/route.ts) hasta que un humano lo reactive aqui.
 */
export async function toggleBotActive(conversationId: string, nextValue: boolean): Promise<void> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { error } = await supabase
    .from("conversations")
    .update({ bot_active: nextValue })
    .eq("id", conversationId)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`No se pudo actualizar el estado del bot: ${error.message}`);
  }

  revalidatePath(`/conversaciones/${conversationId}`);
  revalidatePath("/conversaciones");
}

/**
 * Envia un mensaje como agente humano (no pasa por el LLM). Requiere que el
 * negocio tenga WhatsApp conectado; si `bot_active` seguia en true, lo apaga
 * automaticamente para que el bot no le responda encima al cliente.
 */
export async function sendHumanMessage(
  conversationId: string,
  _prevState: SendMessageActionState,
  formData: FormData,
): Promise<SendMessageActionState> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { error: "Escribe un mensaje antes de enviar." };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, bot_active, contacts(wa_phone)")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .single();

  if (conversationError || !conversation) {
    return { error: "No se encontro la conversación." };
  }

  const contact = conversation.contacts as { wa_phone: string } | null;
  if (!contact?.wa_phone) {
    return { error: "Esta conversación no tiene un contacto de WhatsApp válido." };
  }

  const { data: whatsappConfig, error: configError } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token_encrypted")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (configError || !whatsappConfig) {
    return { error: "Conecta WhatsApp en Integraciones antes de responder desde aquí." };
  }

  const accessToken = decrypt(whatsappConfig.access_token_encrypted);
  const sendResult = await sendWhatsAppMessage({
    phoneNumberId: whatsappConfig.phone_number_id,
    accessToken,
    to: contact.wa_phone,
    text,
  });

  if (!sendResult.ok) {
    return { error: `WhatsApp rechazó el envío: ${sendResult.error}` };
  }

  await insertOutboundMessage(supabase, {
    conversationId,
    organizationId,
    waMessageId: sendResult.waMessageId,
    content: text,
    sender: "human",
  });

  if (conversation.bot_active) {
    await supabase
      .from("conversations")
      .update({ bot_active: false })
      .eq("id", conversationId)
      .eq("organization_id", organizationId);
  }

  revalidatePath(`/conversaciones/${conversationId}`);
  revalidatePath("/conversaciones");
  return null;
}
