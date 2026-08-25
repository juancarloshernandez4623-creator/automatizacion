import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica la firma `X-Hub-Signature-256` que Meta agrega a cada POST del
 * webhook, calculada como HMAC-SHA256 del RAW body usando el App Secret de
 * la app de Meta (ver
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/).
 *
 * IMPORTANTE: `rawBody` debe ser el string EXACTO recibido en la request
 * (antes de cualquier `JSON.parse`), porque el HMAC se calcula sobre esos
 * bytes tal cual. Requiere el modulo nativo `crypto` de Node -- por eso el
 * route handler del webhook declara `export const runtime = 'nodejs'`.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedHex = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const receivedHex = signatureHeader.slice("sha256=".length);

  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");

  // timingSafeEqual lanza si los buffers no tienen la misma longitud, asi
  // que se chequea antes en vez de dejar que explote.
  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}
