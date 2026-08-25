import type { calendar_v3 } from "googleapis";

/**
 * Usado por /citas al marcar una cita como completada: agrega un prefijo al
 * titulo del evento para reflejar el estado (Google Calendar no tiene un
 * concepto nativo de "status" de negocio como el nuestro). Para cancelar,
 * usar `deleteCalendarEvent` (lib/google/delete-event.ts) en su lugar.
 */
export async function markCalendarEventCompleted({
  calendar,
  calendarId,
  eventId,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  const current = await calendar.events.get({ calendarId, eventId }).catch(() => null);
  if (!current?.data) return;

  const baseSummary = (current.data.summary ?? "").replace(/^\[completada\]\s*/i, "");
  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: { summary: `[completada] ${baseSummary}` },
  });
}
