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

  return (res.data.items ?? []).map((event) => ({
    id: event.id ?? "",
    summary: event.summary ?? null,
    description: event.description ?? null,
    startsAt: event.start?.dateTime ?? null,
    endsAt: event.end?.dateTime ?? null,
  }));
}
