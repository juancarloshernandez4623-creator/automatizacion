import { NextResponse, after, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveOrgByPhoneNumberId, resolveOrgByVerifyToken } from "@/lib/whatsapp/resolve-org";
import { verifyWhatsAppSignature } from "@/lib/whatsapp/verify-signature";
import { parseWhatsAppWebhookPayload } from "@/lib/whatsapp/parse-webhook-payload";
import { upsertContact, upsertConversation, insertInboundMessage, insertOutboundMessage } from "@/lib/whatsapp/persist-message";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import { sendTypingIndicator } from "@/lib/whatsapp/send-typing-indicator";
import { resolveTwilioOrganizationId } from "@/lib/twilio/resolve-org";
import { sendTwilioWhatsAppMessage } from "@/lib/twilio/send-message";
import { decrypt } from "@/lib/crypto";
import { runAgent } from "@/lib/agent/run-agent";
import { loadConversationHistory } from "@/lib/agent/message-history";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";

// El HMAC de X-Hub-Signature-256 necesita el modulo nativo `crypto` de
// Node (no disponible en el runtime Edge), y el procesamiento en `after()`
// puede tardar mas de lo que el runtime Edge tolera.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: handshake de verificacion del webhook de Meta. Corre una vez por
 * alta en el dashboard de Meta (no por mensaje). El verify_token se busca
 * entre TODAS las organizaciones porque un solo webhook de Meta puede
 * terminar recibiendo trafico de varias (ver algoritmo documentado en el
 * plan). Twilio Sandbox no tiene un handshake GET equivalente.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token) {
    logger.warn({ event: "whatsapp_webhook_verify_rejected", reason: "bad_mode_or_missing_token" });
    return new NextResponse("Forbidden", { status: 403 });
  }

  const organizationId = await resolveOrgByVerifyToken(token);

  if (!organizationId) {
    logger.warn({ event: "whatsapp_webhook_verify_rejected", reason: "unknown_verify_token" });
    return new NextResponse("Forbidden", { status: 403 });
  }

  logger.info({ event: "whatsapp_webhook_verified", organization_id: organizationId });
  return new NextResponse(challenge ?? "", { status: 200 });
}

/**
 * POST: eventos entrantes de WhatsApp. Este endpoint recibe trafico de DOS
 * proveedores con formatos distintos, distinguidos por Content-Type:
 *
 * - Meta Cloud API (produccion): JSON + firma `X-Hub-Signature-256`. Responde
 *   200 de inmediato y procesa todo dentro de `after()` (agente + envio via
 *   la Graph API ocurren fuera del ciclo de vida de la respuesta HTTP).
 * - Twilio WhatsApp Sandbox (desarrollo/pruebas): form-urlencoded, sin la
 *   infraestructura multi-tenant de Meta (ver `lib/twilio/resolve-org.ts`).
 *   Espera al agente hasta `TWILIO_AGENT_TIMEOUT_MS`: si responde a tiempo,
 *   la respuesta real va directo en el TwiML de esta peticion (gratis, sin
 *   `ContentSid`); si tarda mas, contesta YA con un mensaje de espera (TwiML
 *   tambien) y sigue en segundo plano con `after()`, intentando mandar la
 *   respuesta real por la API de envio de Twilio (esa via si exige
 *   `ContentSid` -- ver detalle en `handleTwilioWebhook`).
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  // Diagnostico: confirma que el proceso de Next.js esta recibiendo la
  // peticion en absoluto (util para descartar problemas de tunel/DNS antes
  // de sospechar del codigo). NextRequest no tiene `.body` ya parseado como
  // Express -- el body real se lee mas abajo, por Content-Type, con
  // `request.text()`.
  console.log("PETICION RECIBIDA:", {
    method: request.method,
    url: request.url,
    contentType,
  });

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return handleTwilioWebhook(request);
  }

  return handleMetaWebhook(request);
}

async function handleMetaWebhook(request: NextRequest): Promise<NextResponse> {
  const receivedAt = Date.now();

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (!signatureHeader) {
    logger.warn({ event: "whatsapp_webhook_missing_signature" });
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(rawBody);
  } catch {
    logger.warn({ event: "whatsapp_webhook_invalid_json" });
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const parsedPayload = parseWhatsAppWebhookPayload(payloadJson);
  if (!parsedPayload) {
    logger.warn({ event: "whatsapp_webhook_unrecognized_payload_shape" });
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const resolved = await resolveOrgByPhoneNumberId(parsedPayload.phoneNumberId);
  if (!resolved) {
    logger.warn({
      event: "whatsapp_webhook_unknown_phone_number_id",
      phone_number_id: parsedPayload.phoneNumberId,
    });
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const appSecret = decrypt(resolved.appSecretEncrypted);
  const signatureValid = verifyWhatsAppSignature(rawBody, signatureHeader, appSecret);

  if (!signatureValid) {
    // Se conoce la organizacion (para el log de auditoria) pero el payload
    // NO se procesa: la firma es lo unico que prueba que el request vino
    // realmente de Meta con este app_secret.
    logger.warn({
      event: "whatsapp_webhook_invalid_signature",
      organization_id: resolved.organizationId,
    });
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  // A partir de aqui el payload es de confianza. Responder 200 YA, antes de
  // tocar la base de datos o invocar al agente.
  const response = NextResponse.json({ status: "ok" }, { status: 200 });

  after(async () => {
    const admin = createAdminClient();
    const accessToken = decrypt(resolved.accessTokenEncrypted);

    for (const message of parsedPayload.messages) {
      const messageStartedAt = Date.now();
      try {
        const contactId = await upsertContact(admin, {
          organizationId: resolved.organizationId,
          waPhone: message.fromPhoneE164,
          contactName: message.contactName,
        });

        const conversation = await upsertConversation(admin, {
          organizationId: resolved.organizationId,
          contactId,
        });

        const { alreadyProcessed } = await insertInboundMessage(admin, {
          conversationId: conversation.id,
          organizationId: resolved.organizationId,
          waMessageId: message.waMessageId,
          content: message.text,
          raw: message as unknown as Json,
        });

        if (alreadyProcessed) {
          logger.info({
            event: "whatsapp_message_duplicate_ignored",
            organization_id: resolved.organizationId,
            wa_message_id: message.waMessageId,
          });
          continue;
        }

        if (!conversation.botActive) {
          logger.info({
            event: "whatsapp_message_stored_bot_inactive",
            organization_id: resolved.organizationId,
            wa_message_id: message.waMessageId,
            latency_ms: Date.now() - messageStartedAt,
          });
          continue;
        }

        // Reacciones (y otros tipos marcados en AGENT_SKIP_TYPES): se
        // guardan arriba para que se vean en el dashboard, pero nunca deben
        // generar una respuesta -- un 👍 no es una pregunta.
        if (!message.needsAgentReply) {
          logger.info({
            event: "whatsapp_message_stored_no_reply_needed",
            organization_id: resolved.organizationId,
            wa_message_id: message.waMessageId,
            message_type: message.type,
            latency_ms: Date.now() - messageStartedAt,
          });
          continue;
        }

        // Da sensacion de atencion inmediata mientras el agente procesa
        // (puede tardar unos segundos si consulta disponibilidad en Google
        // Calendar, etc.). No bloquea ni falla el flujo si Meta lo rechaza.
        await sendTypingIndicator({
          phoneNumberId: resolved.phoneNumberId,
          accessToken,
          messageId: message.waMessageId,
        });

        const { replyText } = await runAgent({
          admin,
          organizationId: resolved.organizationId,
          conversationId: conversation.id,
          contactId,
          contactPhone: message.fromPhoneE164,
        });

        const sendResult = await sendWhatsAppMessage({
          phoneNumberId: resolved.phoneNumberId,
          accessToken,
          to: message.fromPhoneE164,
          text: replyText,
        });

        await insertOutboundMessage(admin, {
          conversationId: conversation.id,
          organizationId: resolved.organizationId,
          waMessageId: sendResult.ok ? sendResult.waMessageId : null,
          content: replyText,
          sender: "bot",
        });

        logger.info({
          event: "whatsapp_message_processed",
          organization_id: resolved.organizationId,
          wa_message_id: message.waMessageId,
          latency_ms: Date.now() - messageStartedAt,
          send_error: sendResult.ok ? undefined : sendResult.error,
        });
      } catch (err) {
        logger.error({
          event: "whatsapp_message_processing_failed",
          organization_id: resolved.organizationId,
          wa_message_id: message.waMessageId,
          latency_ms: Date.now() - messageStartedAt,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info({
      event: "whatsapp_webhook_batch_processed",
      organization_id: resolved.organizationId,
      total_latency_ms: Date.now() - receivedAt,
      message_count: parsedPayload.messages.length,
    });
  });

  return response;
}

/** Cuanto se espera al agente antes de contestar con un mensaje de espera
 * en vez de la respuesta real. Twilio corta la conexion del webhook a los
 * ~5s; 3000ms deja margen para la ida y vuelta real por el tunel de
 * desarrollo (DNS/TLS/proxy de Cloudflare) antes de llegar a ese limite. */
const TWILIO_AGENT_TIMEOUT_MS = 3000;

const TWILIO_FALLBACK_TEXT = "Recibi tu mensaje, dame un momento para responderte. 🙂";

/**
 * Escapa los 5 caracteres especiales de XML. Necesario porque el texto que
 * se inserta en `<Message>` viene de un LLM -- puede contener perfectamente
 * un "&", "<" o comillas que romperian el XML si se insertan tal cual.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Respuesta TwiML vacia: le dice a Twilio "recibido, no generes ningun
 * mensaje de respuesta" -- se usa cuando no hay nada que contestar
 * (mensaje duplicado, bot desactivado, organizacion no resuelta, faltan
 * campos, error guardando el mensaje entrante, etc).
 */
function twilioEmptyResponse(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/**
 * Respuesta TwiML con texto dentro de <Message> -- Twilio la entrega el
 * mismo como reply, sin pasar por la API de envio (`client.messages.create`),
 * por eso NO exige `ContentSid` ni cuesta nada, a diferencia del envio por
 * API usado en el camino de respaldo mas abajo.
 */
function twilioMessageResponse(text: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(text)}</Message></Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/**
 * Twilio WhatsApp Sandbox envia el POST como `application/x-www-form-urlencoded`,
 * con el texto del mensaje en `Body` y el remitente en `From`
 * (`whatsapp:+<E164>`) -- muy distinto del JSON + `X-Hub-Signature-256` de
 * Meta, por eso se maneja en una funcion separada.
 *
 * Estrategia hibrida (evita el timeout de ~5s de Twilio Y el `ContentSid`
 * de la API de envio -- bloqueado en cuentas Trial -- en el caso comun):
 *
 * 1. Guarda el mensaje entrante de forma sincrona (rapido, no es el cuello
 *    de botella).
 * 2. Corre el agente con un limite de `TWILIO_AGENT_TIMEOUT_MS`:
 *    - Si termina a tiempo: la respuesta real va directo en el <Message>
 *      del TwiML de esta misma peticion -- sincrono, gratis, sin
 *      `ContentSid` (asi funcionaba la version anterior de esta funcion,
 *      pero SIEMPRE esperando al agente completo; el problema real no era
 *      que TwiML estuviera bloqueado, sino que el agente + la vuelta por
 *      el tunel a veces superaban el limite de Twilio).
 *    - Si no termina a tiempo: se contesta YA con `TWILIO_FALLBACK_TEXT`
 *      (tambien via TwiML, tambien gratis) para no arriesgar el timeout, y
 *      dentro de `after()` se espera a que el agente termine y se intenta
 *      mandar la respuesta real por la API de envio de Twilio -- esto SI
 *      exige `ContentSid`, asi que en una cuenta Trial es esperable que
 *      falle con el error 21654 (se deja registrado en `send_error`); no
 *      cuesta nada intentarlo, y si la cuenta se actualiza mas adelante
 *      empezara a funcionar sin tocar este codigo.
 *
 * NOTA DE SEGURIDAD (limitacion conocida): a diferencia del flujo de Meta,
 * aqui NO se valida el header `X-Twilio-Signature`. Twilio firma sobre la
 * URL EXTERNA EXACTA que uso para llegar (esquema + host + path + params),
 * y en desarrollo esta app corre detras de un tunel (cloudflared/ngrok)
 * cuyo host publico casi nunca coincide con lo que Next.js ve en
 * `request.url` -- validar mal aqui romperia el sandbox en silencio. Antes
 * de exponer esta ruta en produccion, reconstruir la URL externa real desde
 * `x-forwarded-proto`/`x-forwarded-host` y verificar con
 * `twilio.validateRequest(authToken, signature, url, params)`.
 */
async function handleTwilioWebhook(request: NextRequest): Promise<NextResponse> {
  const receivedAt = Date.now();
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);

  const body = params.get("Body");
  const from = params.get("From");
  const messageSid = params.get("MessageSid");

  console.log("PETICION RECIBIDA (Twilio):", { body, from, messageSid });

  if (!body || !from || !messageSid) {
    logger.warn({ event: "twilio_webhook_missing_fields" });
    return twilioEmptyResponse();
  }

  const admin = createAdminClient();
  const organizationId = await resolveTwilioOrganizationId(admin);

  if (!organizationId) {
    logger.warn({ event: "twilio_webhook_no_organization_resolved" });
    return twilioEmptyResponse();
  }

  // Twilio Sandbox antepone "whatsapp:" al numero; el resto de la app
  // (contacts.wa_phone, etc.) espera solo el E.164 con "+".
  const fromPhoneE164 = from.replace(/^whatsapp:/, "");

  let contactId: string;
  let conversation: Awaited<ReturnType<typeof upsertConversation>>;
  let history: Awaited<ReturnType<typeof loadConversationHistory>>;

  try {
    contactId = await upsertContact(admin, {
      organizationId,
      waPhone: fromPhoneE164,
      contactName: null,
    });

    conversation = await upsertConversation(admin, {
      organizationId,
      contactId,
    });

    const { alreadyProcessed } = await insertInboundMessage(admin, {
      conversationId: conversation.id,
      organizationId,
      waMessageId: messageSid,
      content: body,
      raw: Object.fromEntries(params) as unknown as Json,
    });

    if (alreadyProcessed) {
      logger.info({
        event: "twilio_message_duplicate_ignored",
        organization_id: organizationId,
        wa_message_id: messageSid,
      });
      return twilioEmptyResponse();
    }

    if (!conversation.botActive) {
      logger.info({
        event: "twilio_message_stored_bot_inactive",
        organization_id: organizationId,
        wa_message_id: messageSid,
        latency_ms: Date.now() - receivedAt,
      });
      return twilioEmptyResponse();
    }

    // Se congela el historial AQUI, justo despues de guardar el mensaje
    // entrante y antes de arrancar el agente -- `runAgent` por defecto relee
    // el historial de la BD en el momento en que EL internamente llega a esa
    // linea (no en el momento en que se lo llama), y ese momento puede caer
    // despues de que insertemos el mensaje de espera de mas abajo, con lo
    // que la conversacion terminaria en un turno del bot en vez de en el del
    // usuario -- Anthropic rechaza eso ("must end with a user message").
    // Pasando `historyOverride` se evita esa carrera por completo.
    history = await loadConversationHistory(admin, conversation.id);
  } catch (err) {
    console.error("ERROR GUARDANDO MENSAJE ENTRANTE DE TWILIO:", err);
    logger.error({
      event: "twilio_message_processing_failed",
      organization_id: organizationId,
      wa_message_id: messageSid,
      latency_ms: Date.now() - receivedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    return twilioEmptyResponse();
  }

  // El agente arranca YA; si tarda demasiado, sigue corriendo en segundo
  // plano (dentro del `after()` de abajo) aunque ya hayamos contestado con
  // el mensaje de espera -- por eso la promesa se crea fuera del race.
  const agentPromise = runAgent({
    admin,
    organizationId,
    conversationId: conversation.id,
    contactId,
    contactPhone: fromPhoneE164,
    historyOverride: history,
  });

  const timedOut = Symbol("twilio_agent_timeout");
  const raceResult = await Promise.race([
    agentPromise.then((result) => result.replyText),
    new Promise<typeof timedOut>((resolve) => setTimeout(() => resolve(timedOut), TWILIO_AGENT_TIMEOUT_MS)),
  ]);

  if (raceResult !== timedOut) {
    // El agente termino a tiempo: la respuesta real va directo en el TwiML
    // de esta misma peticion -- sin API de envio, sin ContentSid, gratis.
    await insertOutboundMessage(admin, {
      conversationId: conversation.id,
      organizationId,
      waMessageId: null,
      content: raceResult,
      sender: "bot",
    });

    logger.info({
      event: "twilio_message_processed",
      organization_id: organizationId,
      wa_message_id: messageSid,
      latency_ms: Date.now() - receivedAt,
      mode: "sync_twiml",
    });

    return twilioMessageResponse(raceResult);
  }

  // El agente tardo mas de lo que Twilio tolera: se contesta YA con un
  // mensaje de espera (TwiML, gratis) y se sigue el proceso en segundo
  // plano para intentar mandar la respuesta real por la API de Twilio.
  after(async () => {
    try {
      const { replyText } = await agentPromise;

      const sendResult = await sendTwilioWhatsAppMessage({
        to: fromPhoneE164,
        text: replyText,
      });

      await insertOutboundMessage(admin, {
        conversationId: conversation.id,
        organizationId,
        waMessageId: sendResult.ok ? sendResult.messageSid : null,
        content: replyText,
        sender: "bot",
      });

      logger.info({
        event: "twilio_message_processed",
        organization_id: organizationId,
        wa_message_id: messageSid,
        latency_ms: Date.now() - receivedAt,
        mode: "async_fallback",
        send_error: sendResult.ok ? undefined : sendResult.error,
      });
    } catch (err) {
      console.error("ERROR PROCESANDO SEGUIMIENTO DE TWILIO (IA o envio):", err);
      logger.error({
        event: "twilio_message_processing_failed",
        organization_id: organizationId,
        wa_message_id: messageSid,
        latency_ms: Date.now() - receivedAt,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  await insertOutboundMessage(admin, {
    conversationId: conversation.id,
    organizationId,
    waMessageId: null,
    content: TWILIO_FALLBACK_TEXT,
    sender: "bot",
  });

  return twilioMessageResponse(TWILIO_FALLBACK_TEXT);
}
