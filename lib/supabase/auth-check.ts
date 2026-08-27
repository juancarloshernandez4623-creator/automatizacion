import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** Mismo valor que en `lib/supabase/middleware.ts` -- si Supabase Auth no
 * responde en este tiempo, se trata como "no se pudo verificar" en vez de
 * dejar la request colgada indefinidamente. */
const AUTH_CHECK_TIMEOUT_MS = 4000;

/**
 * Se lanza cuando NO se pudo determinar si hay sesion o no (timeout o error
 * de red hablando con Supabase Auth) -- a diferencia de confirmar que
 * definitivamente no hay sesion. Los consumidores NUNCA deben tratar esto
 * como "no autenticado, a /login": eso es justo lo que produce el sintoma
 * "me logueo pero las pestanas no funcionan y me echa otra vez" durante una
 * incidencia de Supabase (el usuario SI tiene sesion valida, Supabase solo
 * tardo en confirmarlo). Dejar que esto se propague sin capturar hace que
 * `app/error.tsx` lo atrape y ofrezca un "Intentar de nuevo" en vez de un
 * logout falso.
 */
export class AuthCheckFailedError extends Error {
  constructor(message = "No se pudo verificar tu sesión. Inténtalo de nuevo.") {
    super(message);
    this.name = "AuthCheckFailedError";
  }
}

export type AuthCheckResult =
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

/**
 * Envuelve `supabase.auth.getUser()` con el mismo patron de timeout que
 * `lib/supabase/middleware.ts`, distinguiendo dos fallos que sin esto se
 * confunden en uno solo ("no hay user"):
 *
 * - Supabase respondio y confirmo que no hay sesion -> `unauthenticated`
 *   (de verdad no hay usuario logueado; el llamador decide que hacer, ej.
 *   redirigir a /login).
 * - Supabase no respondio a tiempo, o la llamada fallo -> lanza
 *   `AuthCheckFailedError` (ver comentario de la clase). Nunca se devuelve
 *   como `unauthenticated`: eso sería un logout falso.
 *
 * Usado tanto por `requireCurrentOrg()` (Server Actions/API routes, donde
 * "no se pudo verificar" ya se propaga bien como excepcion) como por
 * `AppLayout` (Server Component, donde antes cualquier fallo de
 * `getUser()` se trataba como "no hay sesion" y redirigia a /login sin
 * distincion).
 */
export async function checkAuth(
  supabase: SupabaseClient<Database>,
): Promise<AuthCheckResult> {
  let result: Awaited<ReturnType<SupabaseClient<Database>["auth"]["getUser"]>>;
  try {
    result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("supabase_auth_timeout")), AUTH_CHECK_TIMEOUT_MS);
      }),
    ]);
  } catch {
    throw new AuthCheckFailedError();
  }

  if (!result.data.user) {
    return { status: "unauthenticated" };
  }

  return { status: "authenticated", user: result.data.user };
}
