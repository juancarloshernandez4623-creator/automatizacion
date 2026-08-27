import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type { calendar_v3 } from "googleapis";
import type { BusinessHours, SlotSuggestion, Weekday } from "@/lib/types";

const MAX_SLOTS = 3;
const DEFAULT_DAYS_AHEAD = 7;

type BusyPeriod = { start: number; end: number };

function ymdPlusDays(baseYmd: string, days: number): string {
  // baseYmd es una fecha de calendario pura ("YYYY-MM-DD"); se ancla a
  // medianoche UTC solo para poder sumarle dias con aritmetica de Date sin
  // que un offset horario la corra al dia anterior/siguiente. No representa
  // un instante real, solo se usa para obtener otra fecha de calendario y
  // el nombre del dia de la semana.
  const anchor = new Date(`${baseYmd}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
}

function weekdayKeyOf(ymd: string): Weekday {
  const label = formatInTimeZone(new Date(`${ymd}T00:00:00Z`), "UTC", "EEE").toLowerCase();
  return label as Weekday;
}

function overlaps(aStart: number, aEnd: number, busy: BusyPeriod[]): boolean {
  return busy.some((b) => aStart < b.end && aEnd > b.start);
}

/**
 * Genera hasta 3 horarios libres reales para un servicio, respetando
 * `business_hours` y la disponibilidad real del calendario de Google
 * (FreeBusy query). Devuelve ISO strings (con offset de `timezone`).
 *
 * `searchFrom` (opcional) permite arrancar la busqueda en una fecha futura
 * en vez de "ahora" -- sin esto, como el loop de dias corta apenas junta
 * MAX_SLOTS, un negocio con >=3 huecos libres HOY nunca llegaba a ofrecer
 * nada de manana en adelante, sin importar que `daysAhead` fuera mayor: ese
 * parametro solo mueve el FINAL de la ventana de busqueda, nunca el inicio.
 * Por eso "agenda para la semana que viene" siempre devolvia horarios de
 * hoy. `searchFrom` nunca puede quedar en el pasado real (se recorta contra
 * `now`) para no ofrecer huecos que ya pasaron.
 */
export async function getFreeBusySlots({
  calendar,
  calendarId,
  businessHours,
  durationMinutes,
  daysAhead = DEFAULT_DAYS_AHEAD,
  timezone,
  searchFrom,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  businessHours: BusinessHours;
  durationMinutes: number;
  daysAhead?: number;
  timezone: string;
  /** Instante real a partir del cual buscar; por defecto "ahora". */
  searchFrom?: Date;
}): Promise<SlotSuggestion[]> {
  const now = new Date();
  const effectiveStart = searchFrom && searchFrom.getTime() > now.getTime() ? searchFrom : now;
  const startYmd = formatInTimeZone(effectiveStart, timezone, "yyyy-MM-dd");
  const rangeEnd = fromZonedTime(`${ymdPlusDays(startYmd, daysAhead + 1)}T00:00:00`, timezone);

  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: effectiveStart.toISOString(),
      timeMax: rangeEnd.toISOString(),
      timeZone: timezone,
      items: [{ id: calendarId }],
    },
  });

  const busyRaw = freeBusyRes.data.calendars?.[calendarId]?.busy ?? [];
  const busy: BusyPeriod[] = busyRaw
    .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

  const slots: SlotSuggestion[] = [];

  for (let dayOffset = 0; dayOffset <= daysAhead && slots.length < MAX_SLOTS; dayOffset++) {
    const dayYmd = ymdPlusDays(startYmd, dayOffset);
    const weekday = weekdayKeyOf(dayYmd);
    const ranges = businessHours[weekday] ?? [];

    for (const range of ranges) {
      if (slots.length >= MAX_SLOTS) break;

      let cursorStart = fromZonedTime(`${dayYmd}T${range.start}:00`, timezone);
      const rangeEndDate = fromZonedTime(`${dayYmd}T${range.end}:00`, timezone);

      while (cursorStart.getTime() + durationMinutes * 60_000 <= rangeEndDate.getTime()) {
        const slotStart = cursorStart;
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);

        // Se compara contra `now` real (no `effectiveStart`) para que un
        // `searchFrom` nunca cuele un hueco que ya paso.
        const isPast = slotStart.getTime() <= now.getTime();
        const isBusy = overlaps(slotStart.getTime(), slotEnd.getTime(), busy);

        if (!isPast && !isBusy) {
          slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
          if (slots.length >= MAX_SLOTS) break;
        }

        cursorStart = new Date(cursorStart.getTime() + durationMinutes * 60_000);
      }
    }
  }

  return slots;
}
