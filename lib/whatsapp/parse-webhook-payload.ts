import { z } from "zod";

/**
 * Esquema (parcial, deliberadamente permisivo) del payload que Meta envia al
 * webhook de WhatsApp Cloud API. Cubre eventos de tipo "messages" (mensajes
 * entrantes) y tolera otros campos (ej. "statuses" de entrega/lectura) sin
 * fallar el parseo -- simplemente no traen `messages` y se ignoran.
 *
 * Referencia:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
 */
const webhookContactSchema = z.object({
  wa_id: z.string(),
  profile: z.object({ name: z.string().optional() }).optional(),
});

const webhookMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string().optional(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  // Reaccion a un mensaje previo (alguien pulso un emoji sobre un mensaje
  // nuestro o suyo). `emoji` viene vacio cuando el cliente QUITA una
  // reaccion que habia puesto antes -- no es un mensaje malformado.
  reaction: z.object({ message_id: z.string().optional(), emoji: z.string().optional() }).optional(),
  // Otros tipos (image, audio, button, interactive, location, ...) llegan
  // con sus propias claves; no las tipamos todas, `extractMessageText`
  // aplica un fallback generico.
});

/**
 * Tipos de mensaje que se guardan en la conversacion pero NUNCA deben
 * disparar una respuesta del agente -- una reaccion (ej. un 👍 a un mensaje
 * nuestro) es una senal social ligera, no una pregunta ni una peticion.
 * Antes de esto, cualquier reaccion se colaba a `runAgent` como si fuera un
 * mensaje de texto normal (con el marcador "no soportado" como contenido),
 * y el agente terminaba generando una respuesta confusa sin sentido a algo
 * que nunca pidio nada.
 */
const AGENT_SKIP_TYPES = new Set(["reaction"]);

const webhookValueSchema = z.object({
  metadata: z.object({
    phone_number_id: z.string(),
    display_phone_number: z.string().optional(),
  }),
  contacts: z.array(webhookContactSchema).optional(),
  messages: z.array(webhookMessageSchema).optional(),
});

const webhookChangeSchema = z.object({
  field: z.string().optional(),
  value: webhookValueSchema,
});

const webhookEntrySchema = z.object({
  id: z.string().optional(),
  changes: z.array(webhookChangeSchema),
});

const webhookPayloadSchema = z.object({
  object: z.string().optional(),
  entry: z.array(webhookEntrySchema),
});

export type ParsedWebhookMessage = {
  waMessageId: string;
  fromWaId: string;
  /** E.164 con '+' al frente (Meta lo manda sin '+'). */
  fromPhoneE164: string;
  contactName: string | null;
  text: string;
  type: string;
  /** false para tipos como "reaction": se guardan, pero nunca invocan al agente. */
  needsAgentReply: boolean;
};

export type ParsedWebhookEvent = {
  phoneNumberId: string;
  messages: ParsedWebhookMessage[];
};

function toE164(waId: string): string {
  const digitsOnly = waId.replace(/[^\d]/g, "");
  return digitsOnly.startsWith("+") ? digitsOnly : `+${digitsOnly}`;
}

function extractMessageText(
  message: z.infer<typeof webhookMessageSchema>,
): string {
  if (message.type === "text" && message.text) {
    return message.text.body;
  }
  if (message.type === "reaction") {
    const emoji = message.reaction?.emoji;
    return emoji ? `Reaccionó con ${emoji}` : "Quitó su reacción a un mensaje";
  }
  // Tipos no-texto (image, audio, sticker, location, interactive, button,
  // etc.): guardamos un marcador legible en vez del contenido binario/JSON
  // crudo, para que la conversacion tenga algo visible en el dashboard y el
  // agente pueda responder reconociendo que recibio algo que no puede leer.
  return `[mensaje de tipo "${message.type}" no soportado]`;
}

/**
 * Parsea el body crudo (ya como objeto JS, tras JSON.parse del raw body) del
 * webhook. Devuelve `null` si el payload no tiene la forma esperada (evento
 * desconocido, payload malformado, etc.) -- el caller debe tratar eso como
 * "no hay nada que procesar", nunca como un error fatal.
 */
export function parseWhatsAppWebhookPayload(json: unknown): ParsedWebhookEvent | null {
  const result = webhookPayloadSchema.safeParse(json);
  if (!result.success) {
    return null;
  }

  const firstEntry = result.data.entry[0];
  const firstChange = firstEntry?.changes[0];
  if (!firstChange) {
    return null;
  }

  const { metadata, contacts, messages } = firstChange.value;

  if (!messages || messages.length === 0) {
    // Evento sin mensajes entrantes (ej. status de entrega/lectura): no es
    // un error, simplemente no hay nada que persistir/responder.
    return { phoneNumberId: metadata.phone_number_id, messages: [] };
  }

  const contactByWaId = new Map((contacts ?? []).map((c) => [c.wa_id, c]));

  return {
    phoneNumberId: metadata.phone_number_id,
    messages: messages.map((message) => ({
      waMessageId: message.id,
      fromWaId: message.from,
      fromPhoneE164: toE164(message.from),
      contactName: contactByWaId.get(message.from)?.profile?.name ?? null,
      text: extractMessageText(message),
      type: message.type,
      needsAgentReply: !AGENT_SKIP_TYPES.has(message.type),
    })),
  };
}
