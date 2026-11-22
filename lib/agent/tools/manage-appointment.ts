import { tool } from "ai";
import { z } from "zod";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { deleteCalendarEvent } from "@/lib/google/delete-event";
import type { AgentToolContext } from "./context";

/**
 * Carga una cita CONFIRMADA del cliente actual por id. Nunca permite tocar
 * citas de otro contacto u otra organizacion aunque el modelo invente un id.
 */
async function loadOwnAppointment(ctx: AgentToolContext, appointmentId: string) {
  const { data } = await ctx.admin
    .from("appointments")
    .select("id, service, starts_at, google_event_id")
    .eq("id", appointmentId)
    .eq("organization_id", ctx.organizationId)
    .eq("contact_id", ctx.contactId)
    .eq("status", "confirmed")
    .maybeSingle();
  return data;
}

/**
 * El paciente confirma que vendra (normalmente respondiendo al recordatorio
 * automatico). Queda marcado en el panel para que la clinica sepa que citas
 * estan confirmadas por el propio paciente.
 */
export function createConfirmAttendanceTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Registra que el cliente CONFIRMA que asistira a una de sus citas ya agendadas (por ejemplo al responder 'Confirmo' a un recordatorio). Usa el id de la lista 'Citas ya confirmadas de este cliente'.",
    inputSchema: z.object({
      appointment_id: z.string().describe("id de la cita, de la lista de citas del cliente."),
    }),
    execute: async ({ appointment_id }) => {
      if (ctx.sandbox) {
        return { success: true, sandbox: true, note: "Modo de prueba: no se registro nada." };
      }
      const appointment = await loadOwnAppointment(ctx, appointment_id);
      if (!appointment) {
        return { error: "No encuentro esa cita confirmada para este cliente." };
      }
      const { error } = await ctx.admin
        .from("appointments")
        .update({ attendance_confirmed_at: new Date().toISOString() })
        .eq("id", appointment.id);
      if (error) {
        return { error: "No se pudo registrar la confirmación." };
      }
      return { success: true, appointment: { service: appointment.service, starts_at: appointment.starts_at } };
    },
  });
}

/**
 * Cancela una cita del cliente actual: la marca como cancelada y borra el
 * evento de Google Calendar para liberar el hueco. Para CAMBIAR una cita, el
 * agente primero reserva la nueva (book_appointment) y solo despues cancela
 * la antigua -- asi el paciente nunca se queda sin ninguna.
 */
export function createCancelAppointmentTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Cancela una cita YA AGENDADA del cliente (porque no puede venir, o porque se acaba de reservar otra en su lugar al cambiarla). Libera el hueco en el calendario. Solo llamar cuando el cliente lo haya pedido o confirmado claramente. Usa el id de la lista 'Citas ya confirmadas de este cliente'.",
    inputSchema: z.object({
      appointment_id: z.string().describe("id de la cita a cancelar, de la lista de citas del cliente."),
    }),
    execute: async ({ appointment_id }) => {
      if (ctx.sandbox) {
        return { success: true, sandbox: true, note: "Modo de prueba: no se cancelo nada." };
      }
      const appointment = await loadOwnAppointment(ctx, appointment_id);
      if (!appointment) {
        return { error: "No encuentro esa cita confirmada para este cliente." };
      }

      if (appointment.google_event_id) {
        const calendarClient = await getOrgCalendarClient(ctx.admin, ctx.organizationId);
        if (calendarClient) {
          try {
            await deleteCalendarEvent({
              calendar: calendarClient.calendar,
              calendarId: calendarClient.calendarId,
              eventId: appointment.google_event_id,
            });
          } catch {
            return { error: "No se pudo liberar el hueco en el calendario. Intenta de nuevo." };
          }
        }
      }

      const { error } = await ctx.admin
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);
      if (error) {
        return { error: "No se pudo cancelar la cita." };
      }
      return {
        success: true,
        cancelled: { service: appointment.service, starts_at: appointment.starts_at },
      };
    },
  });
}
