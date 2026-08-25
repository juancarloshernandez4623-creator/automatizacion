"use client";

import { useEffect, useState, useActionState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { saveGoogleCalendarId, type IntegrationsActionState } from "./actions";

type CalendarOption = { id: string; summary: string; primary: boolean };

export function CalendarPicker({ currentCalendarId }: { currentCalendarId: string }) {
  const [calendars, setCalendars] = useState<CalendarOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [state, formAction] = useActionState<IntegrationsActionState, FormData>(
    saveGoogleCalendarId,
    {},
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/google/calendars")
      .then(async (res) => {
        const json = (await res.json()) as
          | { calendars: CalendarOption[] }
          | { error: string };
        if (cancelled) return;
        if ("error" in json) {
          setLoadError(json.error);
        } else {
          setCalendars(json.calendars);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("No pudimos cargar tus calendarios.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }

  if (!calendars) {
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <CircleNotch className="animate-spin" size={16} />
        Cargando tus calendarios de Google…
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <select
        name="calendarId"
        defaultValue={currentCalendarId}
        className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        {calendars.map((cal) => (
          <option key={cal.id} value={cal.id}>
            {cal.summary}
            {cal.primary ? " (principal)" : ""}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Usar este calendario
      </button>
      {state.success && <span className="text-sm text-brand-700">{state.success}</span>}
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
