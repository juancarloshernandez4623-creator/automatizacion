"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { AppointmentModal, type AppointmentRow } from "./appointment-modal";

const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarGrid({
  monthDate,
  appointments,
  organizationTimezone,
}: {
  /** yyyy-MM-01, el mes actualmente visible. */
  monthDate: string;
  appointments: AppointmentRow[];
  organizationTimezone: string;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const currentMonth = new Date(`${monthDate}T00:00:00Z`);
  const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

  const days = useMemo(() => {
    const result: Date[] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      result.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const appt of appointments) {
      const dayKey = formatInTimeZone(appt.starts_at, organizationTimezone, "yyyy-MM-dd");
      const bucket = map.get(dayKey) ?? [];
      bucket.push(appt);
      map.set(dayKey, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    }
    return map;
  }, [appointments, organizationTimezone]);

  const prevMonth = format(subMonths(currentMonth, 1), "yyyy-MM-01");
  const nextMonth = format(addMonths(currentMonth, 1), "yyyy-MM-01");
  const selectedAppointments = selectedDay ? (appointmentsByDay.get(selectedDay) ?? []) : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize text-neutral-900">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-1">
          <Link
            href={`/citas?month=${prevMonth}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
            aria-label="Mes anterior"
          >
            <CaretLeft size={16} />
          </Link>
          <Link
            href={`/citas?month=${format(new Date(), "yyyy-MM-01")}`}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            Hoy
          </Link>
          <Link
            href={`/citas?month=${nextMonth}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
            aria-label="Mes siguiente"
          >
            <CaretRight size={16} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="border-b border-neutral-200 bg-neutral-50 px-2 py-2 text-center text-xs font-medium text-neutral-500"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay.get(dayKey) ?? [];
          const inCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => dayAppointments.length > 0 && setSelectedDay(dayKey)}
              className={`flex h-24 flex-col items-start gap-1 border-b border-r border-neutral-100 p-2 text-left transition last:border-r-0 ${
                inCurrentMonth ? "bg-white hover:bg-neutral-50" : "bg-neutral-50/50 text-neutral-300"
              } ${dayAppointments.length > 0 ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday(day) ? "bg-brand-600 font-semibold text-white" : "text-neutral-700"
                } ${!inCurrentMonth ? "text-neutral-300" : ""}`}
              >
                {format(day, "d")}
              </span>
              {dayAppointments.length > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                  {dayAppointments.length} cita{dayAppointments.length === 1 ? "" : "s"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <AppointmentModal
          date={selectedDay}
          appointments={selectedAppointments}
          organizationTimezone={organizationTimezone}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
