import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** Mismo valor que en `lib/supabase/middleware.ts` -- si Supabase Auth no
 * responde en este tiempo, se trata como "no se pudo verificar" en vez de
 * dejar la request colgada indefinidamente. */
const AUTH_CHECK_TIMEOUT_MS = 4000;

/**
 * Se lanza cuando NO se pudo determinar con certeza si hay sesion o no --
 * timeout, error de red, o CUALQUIER error que Supabase Auth devuelva al
 * intentar revalidar una sesion que YA sabiamos (por la cookie local) que
 * existia. A diferencia de confirmar que definitivamente no hay sesion.
 *
 * Los consumidores NUNCA deben tratar esto como "no autenticado, a /login":
 * eso es justo lo que produce el sintoma "me logueo bien, pero tras varias
 * navegaciones seguidas me echa otra vez" -- el usuario SI tenia sesion
 * valida (aqui abajo se revalida solo cuando la cookie local dice que hay
 * una), Supabase solo fallo momentaneamente al confirmarlo (ej. un limite
 * de peticiones por navegar muy rapido, un fallo puntual de su API). Dejar
 * que esto se propague sin capturar hace que `app/error.tsx` lo atrape y
 * ofrezca un "Intentar de nuevo" en vez de un logout falso.
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
 * Verifica la sesion en dos pasos, para no confundir nunca un fallo
 * transitorio de Supabase con un logout real:
 *
 * 1. `getSession()` -- lectura LOCAL de la cookie, sin red. Si no hay
 *    absolutamente ninguna sesion guardada, es seguro devolver
 *    `unauthenticated` sin arriesgar ni gastar una llamada a Supabase: no
 *    hay nada que un fallo de red pudiera confundir aqui.
 * 2. Solo si hay una sesion local, se REVALIDA de verdad contra Supabase
 *    Auth con `getUser()` (necesario porque `getSession()` por si sola no
 *    verifica el token, ver comentario en middleware.ts). Cualquier fallo
 *    en este paso -- timeout, excepcion, O un `error` en la respuesta
 *    resuelta (antes NO se comprobaba esto ultimo: cualquier error de
 *    Supabase que no lanzara una excepcion, ej. un 429 por demasiadas
 *    peticiones seguidas, se colaba como si fuera "no hay user" y producia
 *    un logout falso) -- se trata como `AuthCheckFailedError`, JAMAS como
 *    `unauthenticated`, porque el paso 1 ya confirmo que SI habia sesion.
 */
export async function checkAuth(
  supabase: SupabaseClient<Database>,
): Promise<AuthCheckResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { status: "unauthenticated" };
  }

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

  if (result.error || !result.data.user) {
    throw new AuthCheckFailedError();
  }

  return { status: "authenticated", user: result.data.user };
}
