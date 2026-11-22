import { GRAPH_API_BASE } from "@/lib/whatsapp/constants";
import type { SendWhatsAppMessageResult } from "@/lib/whatsapp/send-message";

/**
 * Envia un mensaje de PLANTILLA aprobada por Meta. Es la unica forma de
 * escribir a un contacto fuera de la ventana de 24 h desde su ultimo
 * mensaje (los recordatorios de cita casi siempre caen fuera). La plantilla
 * se crea y aprueba en el WhatsApp Manager de la cuenta del negocio; aqui
 * solo se rellenan sus variables del cuerpo ({{1}}, {{2}}...) en orden.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
 */
export async function sendWhatsAppTemplate({
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode,
  bodyParameters,
}: {
  phoneNumberId: string;
  accessToken: string;
  /** E.164, con o sin '+'. */
  to: string;
  templateName: string;
  /** Codigo exacto con el que se aprobo la plantilla, ej. "es" o "es_ES". */
  languageCode: string;
  bodyParameters: string[];
}): Promise<SendWhatsAppMessageResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: bodyParameters.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Graph API ${res.status}: ${body.slice(0, 500)}` };
    }

    const json = (await res.json()) as { messages?: { id: string }[] };
    return { ok: true, waMessageId: json.messages?.[0]?.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error de red desconocido" };
  }
}
