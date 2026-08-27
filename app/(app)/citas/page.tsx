import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { CalendarGrid } from "./calendar-grid";
import { NewAppointmentModal } from "./new-appointment-modal";
import type { AppointmentRow } from "./appointment-modal";

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
        <NewAppointmentModal />
      </div>

      <CalendarGrid
        monthDate={monthDate}
        appointments={(appointments ?? []) as AppointmentRow[]}
        organizationTimezone={organizationTimezone}
      />
    </div>
  );
}
