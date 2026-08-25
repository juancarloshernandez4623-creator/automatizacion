import { google, type calendar_v3 } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { decrypt, encrypt } from "@/lib/crypto";
import { getAuthenticatedClient } from "@/lib/google/oauth";

export type OrgCalendar = {
  calendar: calendar_v3.Calendar;
  calendarId: string;
};

/**
 * Construye un cliente de Google Calendar autenticado para una
 * organizacion, a partir de sus tokens cifrados en `google_calendar_configs`.
 * Si googleapis refresca el access_token internamente, el token nuevo se
 * vuelve a cifrar y persistir para no forzar un refresh en cada llamada.
 *
 * Devuelve `null` si la organizacion no ha conectado Google Calendar
 * todavia -- los callers (tools del agente, acciones de /citas) deben
 * manejar ese caso explicitamente (ej. get_available_slots le informa al
 * LLM que no puede ofrecer horarios).
 */
export async function getOrgCalendarClient(
  admin: SupabaseClient<Database>,
  organizationId: string,
): Promise<OrgCalendar | null> {
  const { data: config } = await admin
    .from("google_calendar_configs")
    .select("calendar_id, refresh_token_encrypted, access_token_encrypted")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!config) {
    return null;
  }

  const refreshToken = decrypt(config.refresh_token_encrypted);
  const accessToken = config.access_token_encrypted
    ? decrypt(config.access_token_encrypted)
    : null;

  const authClient = getAuthenticatedClient(refreshToken, accessToken);

  // Persiste un access_token renovado automaticamente por la libreria, para
  // que la proxima llamada no tenga que golpear el endpoint de refresh de
  // Google si el actual sigue vigente.
  authClient.on("tokens", (tokens) => {
    if (!tokens.access_token) return;
    void admin
      .from("google_calendar_configs")
      .update({
        access_token_encrypted: encrypt(tokens.access_token),
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .then(
        () => undefined,
        () => undefined,
      );
  });

  const calendar = google.calendar({ version: "v3", auth: authClient });

  return { calendar, calendarId: config.calendar_id };
}
