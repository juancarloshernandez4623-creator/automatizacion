import { createClient } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Helper compartido por Server Actions y Server Components: resuelve el
 * `organization_id` (y datos basicos del profile) del usuario autenticado
 * actual. Lanza `UnauthorizedError` si no hay sesion o el profile no tiene
 * organizacion (no deberia pasar, ver private.handle_new_user()).
 *
 * No reemplaza RLS: cada query hecha con el cliente devuelto por
 * `createClient()` sigue filtrando por policies. Este helper solo evita
 * repetir el mismo `select` en cada action/page.
 */
export async function requireCurrentOrg() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

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
