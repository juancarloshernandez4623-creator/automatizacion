import { randomBytes } from "crypto";

// Sin caracteres ambiguos al leerlos en voz alta o escritos a mano (0/O,
// 1/I/L) -- estos codigos los va a transcribir un cliente desde un mensaje
// de WhatsApp o un correo, no copiarlos siempre desde un enlace.
const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * Genera un codigo de invitacion legible tipo `XXXX-XXXX` (8 caracteres del
 * alfabeto de arriba, formateados en dos grupos de 4). Usado unicamente por
 * el panel de admin (app/admin/invites/) para dar de alta nuevos codigos --
 * `code` tiene una constraint `unique` en la tabla, asi que una colision (
 * astronomicamente improbable con 31^8 combinaciones) simplemente hace
 * fallar el INSERT y el llamador puede reintentar con un codigo nuevo.
 */
export function generateInviteCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let raw = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    // `.charAt()` en vez de indexado con `[]`: siempre devuelve `string`
    // (nunca `string | undefined`), y el modulo garantiza que el indice
    // esta en rango de todas formas.
    raw += CODE_CHARSET.charAt((bytes[i] ?? 0) % CODE_CHARSET.length);
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
