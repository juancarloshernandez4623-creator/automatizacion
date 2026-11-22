import type { calendar_v3 } from "googleapis";

export type CalendarEventSummary = {
  id: string;
  summary: string | null;
  description: string | null;
  /** ISO 8601. Eventos de dia completo (sin hora) se descartan por el caller. */
  startsAt: string | null;
  endsAt: string | null;
};

/**
 * Lista eventos de un calendario en un rango de fechas dado, para el flujo
 * de "Importar de Calendar" (ver /citas/actions.ts) -- trae lo que el
 * negocio haya anadido directamente en Google Calendar (desde el movil,
 * otro dispositivo, etc.) para que el panel pueda ofrecerlo como cita.
 */
export async function listCalendarEvents({
  calendar,
  calendarId,
  timeMin,
  timeMax,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  /** ISO 8601 */
  timeMin: string;
  /** ISO 8601 */
  timeMax: string;
}): Promise<CalendarEventSummary[]> {
  const res = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return (res.data.items ?? []).map(toSummary);
}

/**
 * Lee UN evento concreto por id. Lo usa la sincronizacion de /citas
 * (lib/google/sync-appointments.ts) para distinguir, cuando un evento
 * enlazado ya no aparece en el rango visible, entre "se borro en Google"
 * (devuelve `null`) y "se movio a otra fecha fuera del rango" (devuelve el
 * evento con su nueva hora).
 *
 * `null` = borrado: 404/410 de Google, o `status: 'cancelled'` (asi devuelve
 * Google un evento borrado que todavia conserva en su papelera). Cualquier
 * otro error (red, token revocado...) se propaga, para que el caller NO lo
 * confunda con un borrado y cancele la cita por error.
 */
export async function getCalendarEvent({
  calendar,
  calendarId,
  eventId,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  eventId: string;
}): Promise<CalendarEventSummary | null> {
  try {
    const res = await calendar.events.get({ calendarId, eventId });
    if (res.data.status === "cancelled") return null;
    return toSummary(res.data);
  } catch (err) {
    const e = err as { status?: number; code?: number | string; response?: { status?: number } };
    const status = e.response?.status ?? e.status ?? Number(e.code);
    if (status === 404 || status === 410) return null;
    throw err;
  }
}

function toSummary(event: calendar_v3.Schema$Event): CalendarEventSummary {
  return {
    id: event.id ?? "",
    summary: event.summary ?? null,
    description: event.description ?? null,
    startsAt: event.start?.dateTime ?? null,
    endsAt: event.end?.dateTime ?? null,
  };
}
