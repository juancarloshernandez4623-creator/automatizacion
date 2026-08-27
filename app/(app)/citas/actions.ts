"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { markCalendarEventCompleted } from "@/lib/google/update-event";
import { deleteCalendarEvent } from "@/lib/google/delete-event";
import { createCalendarEvent } from "@/lib/google/create-event";
import { upsertContact } from "@/lib/whatsapp/persist-message";

export type UpdateAppointmentResult = { error?: string } | null;

const UNIQUE_VIOLATION = "23505";

export type CreateManualAppointmentInput = {
  fullName: string;
  phone: string;
  service: string;
  /** yyyy-MM-dd, en la zona horaria de la organizacion. */
  date: string;
  /** HH:mm, en la zona horaria de la organizacion. */
  time: string;
  durationMinutes: number;
  isNewPatient: boolean;
  notes: string;
};

/**
 * Crea una cita manualmente desde el dashboard (ej. agendada por telefono),
 * replicando lo que hace la tool book_appointment del agente: crea el
 * contacto si no existe, crea el evento en Google Calendar (si esta
 * conectado) y guarda la cita enlazada via `google_event_id` -- por eso una
 * cita manual SI aparece en el Google Calendar real, igual que una agendada
 * por WhatsApp.
 */
export async function createManualAppointment(
  input: CreateManualAppointmentInput,
): Promise<UpdateAppointmentResult> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const service = input.service.trim();

  if (!fullName || !phone || !service) {
    return { error: "Nombre, teléfono y servicio son obligatorios." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
    return { error: "Fecha u hora inválidas." };
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 5) {
    return { error: "La duración debe ser de al menos 5 minutos." };
  }

  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: org } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", organizationId)
    .single();
  const organizationTimezone = org?.timezone ?? "America/Mexico_City";

  const startsAtDate = fromZonedTime(`${input.date}T${input.time}:00`, organizationTimezone);
  if (Number.isNaN(startsAtDate.getTime())) {
    return { error: "Fecha u hora inválidas." };
  }
  const endsAtDate = new Date(startsAtDate.getTime() + input.durationMinutes * 60_000);

  let contactId: string;
  try {
    contactId = await upsertContact(supabase, {
      organizationId,
      waPhone: phone,
      contactName: fullName,
    });
  } catch {
    return { error: "No se pudo registrar el contacto." };
  }

  let googleEventId: string | null = null;
  const calendarClient = await getOrgCalendarClient(supabase, organizationId);
  if (calendarClient) {
    try {
      googleEventId = await createCalendarEvent({
        calendar: calendarClient.calendar,
        calendarId: calendarClient.calendarId,
        summary: `${service} — ${fullName}`,
        description: `Agendado manualmente desde el panel.${
          input.notes ? `\n${input.notes}` : ""
        }`,
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate.toISOString(),
        timezone: organizationTimezone,
      });
    } catch {
      return { error: "No se pudo crear el evento en Google Calendar. Intenta de nuevo." };
    }
  }

  const { error: insertError } = await supabase.from("appointments").insert({
    organization_id: organizationId,
    contact_id: contactId,
    service,
    starts_at: startsAtDate.toISOString(),
    ends_at: endsAtDate.toISOString(),
    google_event_id: googleEventId,
    is_new_patient: input.isNewPatient,
    full_name: fullName,
    phone,
    notes: input.notes.trim() || null,
  });

  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION) {
      return { error: "Ya hay una cita confirmada para este contacto en ese horario exacto." };
    }
    return {
      error: googleEventId
        ? "El evento se creó en Google Calendar pero no se pudo registrar internamente."
        : "No se pudo crear la cita.",
    };
  }

  revalidatePath("/citas");
  return null;
}

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

/**
 * Elimina una cita por completo (fila de la BD + evento de Google Calendar
 * si existe). A diferencia de `updateAppointmentStatus(..., 'cancelled')`
 * -- que conserva el registro con status='cancelled' para historial -- esto
 * la borra sin dejar rastro; pensado para corregir citas creadas por error
 * (duplicados, datos de prueba, etc.), no para el flujo normal de
 * cancelacion de un cliente.
 */
export async function deleteAppointment(appointmentId: string): Promise<UpdateAppointmentResult> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, google_event_id")
    .eq("id", appointmentId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !appointment) {
    return { error: "No se encontró la cita." };
  }

  if (appointment.google_event_id) {
    const calendarClient = await getOrgCalendarClient(supabase, organizationId);
    if (calendarClient) {
      try {
        await deleteCalendarEvent({
          calendar: calendarClient.calendar,
          calendarId: calendarClient.calendarId,
          eventId: appointment.google_event_id,
        });
      } catch {
        // No bloquear el borrado interno por un fallo de Calendar.
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("organization_id", organizationId);

  if (deleteError) {
    return { error: "No se pudo eliminar la cita." };
  }

  revalidatePath("/citas");
  return null;
}
