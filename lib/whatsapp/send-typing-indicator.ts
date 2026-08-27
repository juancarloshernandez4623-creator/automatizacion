import { GRAPH_API_BASE } from "@/lib/whatsapp/constants";

/**
 * Marca el mensaje entrante como leido y activa el indicador de
 * "escribiendo..." en el WhatsApp del cliente, mientras el agente procesa
 * la respuesta (puede tardar unos segundos si consulta Google Calendar,
 * etc.). Sin esto, el cliente ve el mensaje como "entregado" sin mas senal
 * de que alguien lo esta atendiendo.
 *
 * El indicador desaparece solo cuando se envia el siguiente mensaje real
 * (via sendWhatsAppMessage) o a los ~25s si no llega ninguno -- lo que pase
 * primero. No requiere una llamada explicita para "apagarlo".
 *
 * https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators
 */
export async function sendTypingIndicator({
  phoneNumberId,
  accessToken,
  messageId,
}: {
  phoneNumberId: string;
  accessToken: string;
  /** wa_message_id del mensaje entrante al que se responde. */
  messageId: string;
}): Promise<void> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Graph API ${res.status}: ${body.slice(0, 500)}`);
    }
  } catch (err) {
    // No es critico: si falla, el cliente simplemente no ve el indicador,
    // pero la respuesta real del agente sigue su curso normal.
    console.error("Error activando el indicador de escribiendo:", err);
  }
}
