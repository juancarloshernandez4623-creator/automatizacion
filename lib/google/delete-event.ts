import type { calendar_v3 } from "googleapis";

/**
 * Elimina el evento de Google Calendar correspondiente a una cita cancelada.
 * Idempotente: si el evento ya no existe (404), no lanza.
 */
export async function deleteCalendarEvent({
  calendar,
  calendarId,
  eventId,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    const status = (err as { code?: number; response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 410) {
      return;
    }
    throw err;
  }
}
