import type { calendar_v3 } from "googleapis";

export async function createCalendarEvent({
  calendar,
  calendarId,
  summary,
  description,
  startsAt,
  endsAt,
  timezone,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  summary: string;
  description?: string;
  /** ISO 8601 */
  startsAt: string;
  endsAt: string;
  timezone: string;
}): Promise<string> {
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startsAt, timeZone: timezone },
      end: { dateTime: endsAt, timeZone: timezone },
    },
  });

  if (!res.data.id) {
    throw new Error("Google Calendar no devolvio un ID de evento.");
  }

  return res.data.id;
}
