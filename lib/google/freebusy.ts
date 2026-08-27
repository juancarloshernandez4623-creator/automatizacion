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
 *
 * `earliestTimeOfDay`/`latestTimeOfDay` (opcionales, "HH:mm") acotan cada
 * dia de la busqueda a una franja del dia ("por la tarde", "a primera hora
 * de la manana"). Sin esto, cuando el cliente pedia una franja generica en
 * vez de una hora exacta, la tool devolvia los primeros huecos libres del
 * dia sin importar la franja (normalmente de manana, por ir primero
 * cronologicamente), y como esos huecos no encajaban con lo pedido, el
 * agente terminaba concluyendo -- incorrectamente -- que no habia ninguna
 * disponibilidad en absoluto.
 */
export async function getFreeBusySlots({
  calendar,
  calendarId,
  businessHours,
  durationMinutes,
  daysAhead = DEFAULT_DAYS_AHEAD,
  timezone,
  searchFrom,
  earliestTimeOfDay,
  latestTimeOfDay,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  businessHours: BusinessHours;
  durationMinutes: number;
  daysAhead?: number;
  timezone: string;
  /** Instante real a partir del cual buscar; por defecto "ahora". */
  searchFrom?: Date;
  /** "HH:mm" -- descarta huecos que empiecen antes de esta hora del dia. */
  earliestTimeOfDay?: string;
  /** "HH:mm" -- descarta huecos que terminen despues de esta hora del dia. */
  latestTimeOfDay?: string;
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
      let rangeEndDate = fromZonedTime(`${dayYmd}T${range.end}:00`, timezone);

      // Interseccion con la franja del dia pedida (si la hay): recorta el
      // tramo de este `range` de horario de atencion a lo que caiga dentro
      // de [earliestTimeOfDay, latestTimeOfDay]. Si tras recortar no queda
      // nada (ej. el negocio cierra a las 14:00 y se pidio "por la tarde"
      // desde las 14:00), este `range` simplemente no aporta huecos ese dia.
      if (earliestTimeOfDay) {
        const earliestDate = fromZonedTime(`${dayYmd}T${earliestTimeOfDay}:00`, timezone);
        if (earliestDate.getTime() > cursorStart.getTime()) cursorStart = earliestDate;
      }
      if (latestTimeOfDay) {
        const latestDate = fromZonedTime(`${dayYmd}T${latestTimeOfDay}:00`, timezone);
        if (latestDate.getTime() < rangeEndDate.getTime()) rangeEndDate = latestDate;
      }

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

export type SlotAvailabilityResult =
  | { available: true }
  | { available: false; reason: "past" | "outside_business_hours" | "busy" };

/**
 * Comprueba si un horario CONCRETO (propuesto por el cliente, no elegido de
 * una lista de sugerencias) esta realmente libre: dentro del horario de
 * atencion del dia que le corresponde, no en el pasado, y sin choque con el
 * calendario real. Esto es justo lo que le faltaba al flujo: `getFreeBusySlots`
 * solo SUGIERE huecos (los primeros que encuentra), nunca CONFIRMA uno que
 * el cliente proponga por su cuenta -- sin esta funcion, cuando alguien
 * pedia una hora que no estuviera entre las 3 sugeridas, el agente no tenia
 * ninguna tool que se lo confirmara y terminaba respondiendo "no disponible"
 * por pura precaucion, sin haber comprobado nada de verdad (aunque el hueco
 * estuviera perfectamente libre).
 */
export async function isSlotAvailable({
  calendar,
  calendarId,
  businessHours,
  startsAt,
  durationMinutes,
  timezone,
}: {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  businessHours: BusinessHours;
  startsAt: Date;
  durationMinutes: number;
  timezone: string;
}): Promise<SlotAvailabilityResult> {
  const now = new Date();
  if (startsAt.getTime() <= now.getTime()) {
    return { available: false, reason: "past" };
  }

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const dayYmd = formatInTimeZone(startsAt, timezone, "yyyy-MM-dd");
  const weekday = weekdayKeyOf(dayYmd);
  const ranges = businessHours[weekday] ?? [];

  const fitsBusinessHours = ranges.some((range) => {
    const rangeStart = fromZonedTime(`${dayYmd}T${range.start}:00`, timezone);
    const rangeEnd = fromZonedTime(`${dayYmd}T${range.end}:00`, timezone);
    return startsAt.getTime() >= rangeStart.getTime() && endsAt.getTime() <= rangeEnd.getTime();
  });

  if (!fitsBusinessHours) {
    return { available: false, reason: "outside_business_hours" };
  }

  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: startsAt.toISOString(),
      timeMax: endsAt.toISOString(),
      timeZone: timezone,
      items: [{ id: calendarId }],
    },
  });

  const busyRaw = freeBusyRes.data.calendars?.[calendarId]?.busy ?? [];
  const busy: BusyPeriod[] = busyRaw
    .filter((b): b is { start: string; end: string } => Boolean(b.start && b.end))
    .map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }));

  if (overlaps(startsAt.getTime(), endsAt.getTime(), busy)) {
    return { available: false, reason: "busy" };
  }

  return { available: true };
}
