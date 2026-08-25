import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Resuelve a que organizacion pertenece el trafico entrante por el Sandbox
 * de WhatsApp de Twilio.
 *
 * A diferencia de `whatsapp_configs` (Meta), el Sandbox de Twilio es un
 * numero COMPARTIDO globalmente por todos los desarrolladores que lo usan
 * -- no hay un `phone_number_id` propio por organizacion con el que
 * resolver el tenant como en `lib/whatsapp/resolve-org.ts`. Por eso esta
 * integracion es deliberadamente de un solo tenant, pensada para pruebas
 * locales de UNA organizacion a la vez:
 *
 * 1. Si `TWILIO_ORGANIZATION_ID` esta seteada, se usa esa organizacion.
 * 2. Si no, y existe EXACTAMENTE una organizacion en la base de datos, se
 *    usa esa (caso tipico: un solo desarrollador probando localmente).
 * 3. En cualquier otro caso (cero, o mas de una organizacion sin la env var
 *    seteada) se rechaza explicitamente -- nunca se adivina a que
 *    organizacion pertenece un mensaje.
 */
export async function resolveTwilioOrganizationId(
  admin: SupabaseClient<Database>,
): Promise<string | null> {
  const configured = process.env.TWILIO_ORGANIZATION_ID;
  if (configured) {
    return configured;
  }

  const { data, error } = await admin.from("organizations").select("id").limit(2);

  if (error || !data || data.length !== 1) {
    return null;
  }

  return data[0]?.id ?? null;
}
