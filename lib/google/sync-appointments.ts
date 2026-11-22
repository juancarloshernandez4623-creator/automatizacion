import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { OrgCalendar } from "@/lib/google/calendar-client";
import {
  getCalendarEvent,
  listCalendarEvents,
  type CalendarEventSummary,
} from "@/lib/google/list-events";

/**
 * Valor de `appointments.service` con el que "Importar de Calendar" guarda
 * los eventos creados directamente en Google. Sirve para saber que, en esas
 * citas, el titulo y la descripcion del evento SON los datos de la cita (y
 * por tanto se sincronizan); en las citas del agente o manuales el titulo
 * de Calendar es solo un reflejo ("Servicio — Nombre") y nunca se usa para
 * sobrescribir el nombre o el servicio guardados.
 */
export const IMPORTED_SERVICE = "Evento importado de Calendar";

export type SyncResult = {
  /** Citas cuya hora/titulo/descripcion se actualizo desde Google. */
  updated: number;
  /** Citas marcadas como canceladas porque el evento se borro en Google. */
  cancelled: number;
};

type LinkedAppointment = {
  id: string;
  google_event_id: string | null;
  service: string;
  starts_at: string;
  ends_at: string;
  full_name: string;
  notes: string | null;
};

const LINKED_COLUMNS = "id, google_event_id, service, starts_at, ends_at, full_name, notes";

/**
 * Trae a la BD los cambios hechos DIRECTAMENTE en Google Calendar (desde el
 * movil, otro ordenador...) sobre citas que ya estan enlazadas por
 * `google_event_id` -- tanto las agendadas por el agente/manualmente como
 * las importadas:
 *
 * - Evento movido de hora/dia  -> se actualizan starts_at/ends_at.
 * - Evento renombrado o con descripcion editada (solo citas importadas) ->
 *   se actualizan full_name/notes.
 * - Evento borrado              -> la cita pasa a status 'cancelled'.
 *
 * Solo toca citas 'confirmed': las completadas/canceladas son historial.
 * NUNCA crea citas nuevas (eso sigue siendo "Importar de Calendar", a
 * peticion, para no meter eventos personales del negocio en el panel).
 *
 * Cubre los dos casos de borde de mirar solo el rango visible:
 * - Una cita del rango cuyo evento ya no aparece en el listado se consulta
 *   por id antes de cancelarla: puede que solo se haya movido a otro mes.
 * - Un evento del listado enlazado a una cita que estaba FUERA del rango
 *   (se movio hacia este mes) tambien se reconoce y se actualiza.
 *
 * Lanza si el listado de Calendar falla (el caller decide si es
 * best-effort); los fallos de una cita concreta se omiten y se reintentan
 * en la siguiente sincronizacion.
 */
export async function syncLinkedAppointments({
  supabase,
  organizationId,
  calendarClient,
  rangeStart,
  rangeEnd,
}: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  calendarClient: OrgCalendar;
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, cancelled: 0 };

  const events = await listCalendarEvents({
    calendar: calendarClient.calendar,
    calendarId: calendarClient.calendarId,
    timeMin: rangeStart.toISOString(),
    timeMax: rangeEnd.toISOString(),
  });
  const eventsById = new Map(events.filter((e) => e.id).map((e) => [e.id, e]));

  // Citas confirmadas enlazadas que caen en el rango...
  const { data: inRange } = await supabase
    .from("appointments")
    .select(LINKED_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("status", "confirmed")
    .not("google_event_id", "is", null)
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString());

  // ...mas las que estaban fuera pero cuyo evento ahora aparece en el rango.
  const listedIds = [...eventsById.keys()];
  const { data: movedIn } =
    listedIds.length > 0
      ? await supabase
          .from("appointments")
          .select(LINKED_COLUMNS)
          .eq("organization_id", organizationId)
          .eq("status", "confirmed")
          .in("google_event_id", listedIds)
      : { data: [] as LinkedAppointment[] };

  const appointments = new Map<string, LinkedAppointment>();
  for (const a of [...(inRange ?? []), ...(movedIn ?? [])]) appointments.set(a.id, a);

  for (const appointment of appointments.values()) {
    const eventId = appointment.google_event_id;
    if (!eventId) continue;

    try {
      let event: CalendarEventSummary | null | undefined = eventsById.get(eventId);
      if (!event) {
        event = await getCalendarEvent({
          calendar: calendarClient.calendar,
          calendarId: calendarClient.calendarId,
          eventId,
        });
      }

      if (event === null) {
        const { error } = await supabase
          .from("appointments")
          .update({ status: "cancelled" })
          .eq("id", appointment.id)
          .eq("organization_id", organizationId);
        if (!error) result.cancelled++;
        continue;
      }

      const changes = diffAppointment(appointment, event);
      if (!changes) continue;

      const { error } = await supabase
        .from("appointments")
        .update(changes)
        .eq("id", appointment.id)
        .eq("organization_id", organizationId);
      // Un error aqui (ej. el indice unico contacto+hora si se movio encima
      // de otra cita del mismo contacto) no debe cortar el resto del lote.
      if (!error) result.updated++;
    } catch {
      // Fallo puntual de Google con este evento: se reintenta en la
      // siguiente sincronizacion, nunca se interpreta como borrado.
    }
  }

  return result;
}

function diffAppointment(
  appointment: LinkedAppointment,
  event: CalendarEventSummary,
): Database["public"]["Tables"]["appointments"]["Update"] | null {
  const changes: Database["public"]["Tables"]["appointments"]["Update"] = {};

  // Un evento pasado a "todo el dia" no tiene hora: se deja la que habia.
  if (event.startsAt && event.endsAt) {
    if (!sameInstant(event.startsAt, appointment.starts_at)) changes.starts_at = event.startsAt;
    if (!sameInstant(event.endsAt, appointment.ends_at)) changes.ends_at = event.endsAt;
  }

  if (appointment.service === IMPORTED_SERVICE) {
    const name = event.summary?.trim() || "(sin título)";
    if (name !== appointment.full_name) changes.full_name = name;
    const notes = event.description ?? null;
    if (notes !== appointment.notes) changes.notes = notes;
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

function sameInstant(a: string, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}
