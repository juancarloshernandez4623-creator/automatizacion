/**
 * Supabase Auth exige un email para el login con contraseña; como una clave
 * de acceso (XXXX-XXXX) no es un email, se le asocia uno "sintetico" que
 * nunca recibe correo real, solo existe para identificar la fila en
 * `auth.users`. `.invalid` es el TLD reservado por la RFC 2606 exactamente
 * para direcciones que no deben resolver nunca a un dominio real -- la
 * eleccion correcta aqui, no un dominio inventado que en teoria alguien
 * podria registrar.
 *
 * Determinista a partir del codigo (mismo codigo -> mismo email siempre),
 * asi que no hace falta guardarlo aparte para poder recalcularlo; se
 * guarda de todas formas en `access_codes.login_email` para no repetir
 * esta transformacion en cada sitio que la necesite.
 */
export function deriveLoginEmail(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/-/g, "");
  return `${normalized.toLowerCase()}@codigo.invalid`;
}

/**
 * Normaliza lo que el cliente escribe en el campo "Código de acceso" antes
 * de usarlo como contraseña -- acepta minusculas, espacios de mas, o el
 * guion omitido, y siempre lo deja en el mismo formato XXXX-XXXX con el que
 * se genero (ver lib/auth/invite-code.ts).
 */
export function normalizeAccessCode(rawCode: string): string {
  const cleaned = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) return rawCode.trim().toUpperCase();
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}
