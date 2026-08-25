import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Cliente de Supabase con la SERVICE ROLE KEY: bypassa RLS por completo.
 *
 * Uso EXCLUSIVO en contextos de servidor sin sesion de usuario donde el
 * codigo mismo es responsable de filtrar por `organization_id` (el webhook
 * de WhatsApp, que resuelve la organizacion desde `phone_number_id` antes de
 * tocar cualquier tabla; jobs internos; etc).
 *
 * NUNCA importar este modulo desde un Client Component ni desde codigo que
 * pueda terminar en el bundle del navegador -- `SUPABASE_SERVICE_ROLE_KEY`
 * no lleva el prefijo `NEXT_PUBLIC_` precisamente para que Next.js falle si
 * se intenta usar fuera del servidor.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
