import { GRAPH_API_BASE } from "@/lib/whatsapp/constants";

export type SendWhatsAppMessageResult =
  | { ok: true; waMessageId: string | null }
  | { ok: false; error: string };

/**
 * Envia un mensaje de texto saliente via WhatsApp Cloud API.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */
export async function sendWhatsAppMessage({
  phoneNumberId,
  accessToken,
  to,
  text,
}: {
  phoneNumberId: string;
  accessToken: string;
  /** E.164, con o sin '+'; Meta acepta ambos formatos. */
  to: string;
  text: string;
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
        type: "text",
        text: { body: text, preview_url: false },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Graph API ${res.status}: ${body.slice(0, 500)}` };
    }

    const json = (await res.json()) as {
      messages?: { id: string }[];
    };

    return { ok: true, waMessageId: json.messages?.[0]?.id ?? null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red desconocido",
    };
  }
}
