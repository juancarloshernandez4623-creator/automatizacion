import { createClient } from "@/lib/supabase/server";
import { checkAuth, AuthCheckFailedError } from "@/lib/supabase/auth-check";

export { AuthCheckFailedError };

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Helper compartido por Server Actions y Server Components: resuelve el
 * `organization_id` (y datos basicos del profile) del usuario autenticado
 * actual. Lanza `UnauthorizedError` si Supabase confirma que no hay sesion
 * o el profile no tiene organizacion (no deberia pasar, ver
 * private.handle_new_user()); lanza `AuthCheckFailedError` (ver
 * lib/supabase/auth-check.ts) si no se pudo determinar si hay sesion o no
 * -- ese caso NUNCA se trata como "no autenticado", para no confundir una
 * incidencia temporal de Supabase con un logout real.
 *
 * No reemplaza RLS: cada query hecha con el cliente devuelto por
 * `createClient()` sigue filtrando por policies. Este helper solo evita
 * repetir el mismo `select` en cada action/page.
 */
export async function requireCurrentOrg() {
  const supabase = await createClient();

  const authResult = await checkAuth(supabase);
  if (authResult.status === "unauthenticated") {
    throw new UnauthorizedError();
  }
  const user = authResult.user;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organization_id) {
    throw new UnauthorizedError("Tu cuenta no tiene una organizacion asociada.");
  }

  return {
    supabase,
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role,
    fullName: profile.full_name,
  };
}
