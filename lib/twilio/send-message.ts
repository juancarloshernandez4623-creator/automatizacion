import twilio from "twilio";

export type SendTwilioMessageResult =
  | { ok: true; messageSid: string }
  | { ok: false; error: string };

function normalizeWhatsAppAddress(raw: string): string {
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${raw}`;
}

/**
 * Envia un mensaje de WhatsApp via la API REST de Twilio (usada por el
 * Sandbox de WhatsApp).
 *
 * A diferencia de `lib/whatsapp/send-message.ts` (Meta Graph API,
 * credenciales cifradas por organizacion en BD), esta integracion usa una
 * sola cuenta de Twilio configurada por variables de entorno -- ver la nota
 * de single-tenant en `lib/twilio/resolve-org.ts`.
 */
export async function sendTwilioWhatsAppMessage({
  to,
  text,
}: {
  /** Numero del destinatario, con o sin el prefijo "whatsapp:". */
  to: string;
  text: string;
}): Promise<SendTwilioMessageResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  // Content Template aprobado (o pendiente de aprobacion) en Twilio Content
  // API, con UNA variable de texto libre (body "{{1}}" o similar) -- fuera
  // de cuentas Trial, WhatsApp exige un ContentSid para mensajes disparados
  // por la API (no aplica a la respuesta sincronica por TwiML). Si no esta
  // configurado, se intenta mandar `body` libre tal cual (funcionaria en
  // cuentas exentas de ese requisito).
  const contentSid = process.env.TWILIO_CONTENT_SID;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      error: "Twilio no esta configurado (faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER).",
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      from: normalizeWhatsAppAddress(fromNumber),
      to: normalizeWhatsAppAddress(to),
      ...(contentSid
        ? { contentSid, contentVariables: JSON.stringify({ "1": text }) }
        : { body: text }),
    });
    return { ok: true, messageSid: message.sid };
  } catch (err) {
    // Los errores del SDK de Twilio (clase RestException) traen `code` y
    // `moreInfo` (link a la doc del error especifico) ademas de `message` --
    // se registran aparte porque son la pista real para diagnosticar (ej.
    // "ContentSid Required" == la cuenta exige un Content Template
    // aprobado para enviar, no admite `body` libre).
    const twilioErr = err as { message?: string; code?: number; moreInfo?: string };
    console.error("ERROR DEL SDK DE TWILIO AL ENVIAR MENSAJE:", {
      message: twilioErr?.message ?? String(err),
      code: twilioErr?.code,
      moreInfo: twilioErr?.moreInfo,
    });
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
