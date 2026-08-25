import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado simetrico AES-256-GCM para credenciales sensibles guardadas en BD
 * (access tokens, refresh tokens, app secrets de WhatsApp/Google). Servidor
 * unicamente: este modulo usa `node:crypto`, no puede ejecutarse en el
 * navegador ni en el runtime Edge.
 *
 * Formato de salida: "<iv_base64>.<authTag_base64>.<ciphertext_base64>".
 *
 * Limitacion conocida (documentada en el plan/README): una sola
 * ENCRYPTION_KEY estatica cifra los secretos de TODAS las organizaciones.
 * No hay rotacion de claves en esta v1; si la clave se compromete, hay que
 * re-cifrar todo con una clave nueva manualmente.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // recomendado por NIST para GCM

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY no esta definida. Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY debe decodificar a exactamente 32 bytes (recibidos: ${key.length}). Debe estar en base64.`,
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ".",
  );
}

export function decrypt(encoded: string): string {
  const key = getKey();
  const parts = encoded.split(".");
  if (parts.length !== 3) {
    throw new Error("Formato de texto cifrado invalido (se esperaban 3 segmentos).");
  }
  const [ivB64, authTagB64, ciphertextB64] = parts as [string, string, string];

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
