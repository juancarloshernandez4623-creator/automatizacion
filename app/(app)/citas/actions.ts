"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { markCalendarEventCompleted } from "@/lib/google/update-event";
import { deleteCalendarEvent } from "@/lib/google/delete-event";

export type UpdateAppointmentResult = { error?: string } | null;

/**
 * Cambia el status de una cita y mantiene Google Calendar sincronizado:
 * 'completed' -> marca el evento (patch de titulo, no lo borra);
 * 'cancelled' -> borra el evento de Calendar por completo.
 * Si el negocio ya no tiene Google conectado, o el evento ya no existe, el
 * cambio de status en la BD igual se aplica -- Calendar es el reflejo, no
 * la fuente de verdad de nuestro lado.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: "completed" | "cancelled",
): Promise<UpdateAppointmentResult> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, google_event_id, status")
    .eq("id", appointmentId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !appointment) {
    return { error: "No se encontró la cita." };
  }

  if (appointment.status !== "confirmed") {
    return { error: "Esta cita ya no está confirmada." };
  }

  if (appointment.google_event_id) {
    const calendarClient = await getOrgCalendarClient(supabase, organizationId);
    if (calendarClient) {
      try {
        if (status === "completed") {
          await markCalendarEventCompleted({
            calendar: calendarClient.calendar,
            calendarId: calendarClient.calendarId,
            eventId: appointment.google_event_id,
          });
        } else {
          await deleteCalendarEvent({
            calendar: calendarClient.calendar,
            calendarId: calendarClient.calendarId,
            eventId: appointment.google_event_id,
          });
        }
      } catch {
        // No bloquear el cambio de status interno por un fallo de Calendar
        // (ej. token revocado); el usuario puede reintentar la sync
        // manualmente desde Google si hace falta.
      }
    }
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return { error: "No se pudo actualizar la cita." };
  }

  revalidatePath("/citas");
  return null;
}
