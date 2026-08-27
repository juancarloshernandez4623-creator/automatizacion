import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { listCalendarEvents } from "@/lib/google/list-events";
import { CalendarGrid } from "./calendar-grid";
import { NewAppointmentModal } from "./new-appointment-modal";
import { ImportCalendarButton } from "./import-calendar-button";
import type { AppointmentRow } from "./appointment-modal";

/**
 * Si una cita confirmada y enlazada a Calendar (google_event_id) ya no
 * existe en Google Calendar -- porque se borro manualmente desde otro
 * dispositivo con el mismo calendario -- la marca como cancelada aqui.
 * A diferencia de "Importar de Calendar" (que SOLO agrega, a peticion, para
 * no meter eventos personales ajenos), esto SI corre automaticamente en
 * cada carga de /citas: es puramente una limpieza de citas que ya se sabe
 * con certeza que representan (por su google_event_id, que nosotros mismos
 * asignamos) y que ya no existen en la fuente real -- nunca borra ni oculta
 * nada que el negocio no haya visto reflejado como "citas nuestras".
 * Best-effort: si Calendar no responde, simplemente no se reconcilia esta
 * carga y se reintenta en la siguiente.
 */
async function reconcileDeletedCalendarEvents(
  supabase: Awaited<ReturnType<typeof requireCurrentOrg>>["supabase"],
  organizationId: string,
  gridStart: Date,
  gridEnd: Date,
): Promise<void> {
  const calendarClient = await getOrgCalendarClient(supabase, organizationId);
  if (!calendarClient) return;

  const { data: linked } = await supabase
    .from("appointments")
    .select("id, google_event_id")
    .eq("organization_id", organizationId)
    .eq("status", "confirmed")
    .not("google_event_id", "is", null)
    .gte("starts_at", gridStart.toISOString())
    .lt("starts_at", gridEnd.toISOString());

  if (!linked || linked.length === 0) return;

  let events;
  try {
    events = await listCalendarEvents({
      calendar: calendarClient.calendar,
      calendarId: calendarClient.calendarId,
      timeMin: gridStart.toISOString(),
      timeMax: gridEnd.toISOString(),
    });
  } catch {
    return;
  }

  const existingEventIds = new Set(events.map((e) => e.id).filter(Boolean));
  const orphanedIds = linked
    .filter((a) => a.google_event_id && !existingEventIds.has(a.google_event_id))
    .map((a) => a.id);

  if (orphanedIds.length === 0) return;

  await supabase.from("appointments").update({ status: "cancelled" }).in("id", orphanedIds);
}

function parseMonthParam(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}-01$/.test(raw)) return raw;
  return format(new Date(), "yyyy-MM-01");
}

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const monthDate = parseMonthParam(monthParam);

  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: org } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", organizationId)
    .single();
  const organizationTimezone = org?.timezone ?? "America/Mexico_City";

  const currentMonth = new Date(`${monthDate}T00:00:00Z`);
  const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const gridEnd = addDays(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), 1);

  await reconcileDeletedCalendarEvents(supabase, organizationId, gridStart, gridEnd);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, service, starts_at, ends_at, status, full_name, phone, is_new_patient, notes")
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")
    .gte("starts_at", gridStart.toISOString())
    .lt("starts_at", gridEnd.toISOString())
    .order("starts_at", { ascending: true });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Citas</h1>
          <p className="text-sm text-neutral-500">
            Todas las citas agendadas por el agente o manualmente, sincronizadas con Google Calendar.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <ImportCalendarButton monthDate={monthDate} />
          <NewAppointmentModal />
        </div>
      </div>

      <CalendarGrid
        monthDate={monthDate}
        appointments={(appointments ?? []) as AppointmentRow[]}
        organizationTimezone={organizationTimezone}
      />
    </div>
  );
}
