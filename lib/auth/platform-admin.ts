import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/supabase/auth-check";

/**
 * Comprueba si el usuario logueado actual es el dueño de la plataforma (tu,
 * Juan Carlos, vendiendo el servicio a varias clinicas) -- distinto de
 * `role: 'owner'` en `profiles`, que es el dueño de UN negocio concreto
 * dentro de su propia organizacion.
 *
 * Deliberadamente NO es una tabla/rol nuevo en la base de datos: con una
 * sola persona necesitando este acceso, comparar el email de la sesion
 * contra una variable de entorno es mas simple y con la misma seguridad
 * real (sigue exigiendo pasar por el login normal de Supabase Auth) que
 * anadir una columna `is_platform_admin` y sus policies de RLS asociadas.
 * Si algun dia hay mas de una persona con este acceso, esto es lo primero
 * que habria que cambiar por una tabla de verdad.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL;
  if (!adminEmail) return false;

  const supabase = await createClient();
  const authResult = await checkAuth(supabase);
  if (authResult.status !== "authenticated") return false;

  return authResult.user.email?.toLowerCase() === adminEmail.toLowerCase();
}
