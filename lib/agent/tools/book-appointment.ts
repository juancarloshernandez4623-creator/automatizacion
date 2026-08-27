import { tool } from "ai";
import { z } from "zod";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { createCalendarEvent } from "@/lib/google/create-event";
import { getFreeBusySlots, isSlotAvailable } from "@/lib/google/freebusy";
import type { AgentToolContext } from "./context";

const UNIQUE_VIOLATION = "23505";

export function createBookAppointmentTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Agenda una cita para el cliente actual. Solo llamar despues de confirmar verbalmente servicio, horario (que debe venir de get_available_slots) y nombre completo.",
    inputSchema: z.object({
      full_name: z.string().min(1).describe("Nombre completo del cliente."),
      service: z.string().describe("Nombre exacto del servicio (de la lista de servicios)."),
      starts_at: z
        .string()
        .describe("Fecha/hora de inicio en ISO 8601, EXACTAMENTE uno de los slots devueltos por get_available_slots."),
      is_new_patient: z
        .boolean()
        .optional()
        .describe("Si el cliente es paciente/cliente nuevo. Omitir si el negocio no lo pide."),
    }),
    execute: async ({ full_name, service, starts_at, is_new_patient }) => {
      const matchedService = ctx.services.find(
        (s) => s.name.trim().toLowerCase() === service.trim().toLowerCase(),
      );
      if (!matchedService) {
        return { error: `Servicio "${service}" no reconocido, no se pudo agendar.` };
      }

      const startsAtDate = new Date(starts_at);
      if (Number.isNaN(startsAtDate.getTime())) {
        return { error: "La fecha/hora proporcionada no es valida." };
      }
      const endsAtDate = new Date(startsAtDate.getTime() + matchedService.duration_minutes * 60_000);

      if (ctx.sandbox) {
        return {
          success: true,
          sandbox: true,
          appointment: {
            full_name,
            service: matchedService.name,
            starts_at: startsAtDate.toISOString(),
            ends_at: endsAtDate.toISOString(),
            is_new_patient: is_new_patient ?? null,
          },
          note: "Modo de prueba: no se creo ninguna cita real ni evento de calendario.",
        };
      }

      // Idempotencia a nivel aplicacion: si el mismo contacto ya tiene una
      // cita confirmada en ese slot exacto (ej. el LLM reintento la tool
      // tras un timeout de red), no duplicar. El indice unico parcial de
      // appointments (migracion 0010) es la garantia real contra
      // condiciones de carrera; este chequeo evita una llamada innecesaria
      // a Google Calendar en el caso comun.
      const { data: existing } = await ctx.admin
        .from("appointments")
        .select("id, service, starts_at, ends_at, status")
        .eq("contact_id", ctx.contactId)
        .eq("starts_at", startsAtDate.toISOString())
        .eq("status", "confirmed")
        .maybeSingle();

      if (existing) {
        return { success: true, alreadyExisted: true, appointment: existing };
      }

      const calendarClient = await getOrgCalendarClient(ctx.admin, ctx.organizationId);
      if (!calendarClient) {
        return {
          error:
            "Este negocio aun no ha conectado su Google Calendar, no puedo crear la cita todavia. Pide que un humano la agende manualmente.",
        };
      }

      // Revalidacion defensiva justo antes de crear nada: `starts_at` puede
      // venir de una sugerencia de hace varios turnos de conversacion (el
      // cliente tardo en confirmar, o el LLM lo reconstruyo a mano en vez de
      // copiar el valor exacto de una tool anterior) -- nunca crear el
      // evento sin comprobar aqui mismo, con datos reales, que ese horario
      // sigue libre. Antes de este cambio no habia ninguna comprobacion aqui:
      // si algo fallaba mas adelante (ej. Calendar), el LLM terminaba
      // inventando un "parece que no esta disponible" sin ningun dato real
      // detras, y volvia a ofrecer las mismas 3 sugerencias de siempre.
      const availability = await isSlotAvailable({
        calendar: calendarClient.calendar,
        calendarId: calendarClient.calendarId,
        businessHours: ctx.businessHours,
        startsAt: startsAtDate,
        durationMinutes: matchedService.duration_minutes,
        timezone: ctx.organizationTimezone,
      });

      if (!availability.available) {
        const alternatives = await getFreeBusySlots({
          calendar: calendarClient.calendar,
          calendarId: calendarClient.calendarId,
          businessHours: ctx.businessHours,
          durationMinutes: matchedService.duration_minutes,
          timezone: ctx.organizationTimezone,
          searchFrom: startsAtDate,
        });
        return {
          error:
            availability.reason === "busy"
              ? "Ese horario ya no esta libre (se ocupo mientras tanto)."
              : availability.reason === "outside_business_hours"
                ? "Ese horario esta fuera del horario de atencion del negocio."
                : "Ese horario ya paso.",
          alternatives,
        };
      }

      let googleEventId: string | null = null;
      try {
        googleEventId = await createCalendarEvent({
          calendar: calendarClient.calendar,
          calendarId: calendarClient.calendarId,
          summary: `${matchedService.name} — ${full_name}`,
          description: `Agendado por el agente de WhatsApp.${
            is_new_patient !== undefined ? `\nPaciente nuevo: ${is_new_patient ? "si" : "no"}.` : ""
          }`,
          startsAt: startsAtDate.toISOString(),
          endsAt: endsAtDate.toISOString(),
          timezone: ctx.organizationTimezone,
        });
      } catch {
        return { error: "No se pudo crear el evento en Google Calendar. Intenta de nuevo." };
      }

      const { data: inserted, error } = await ctx.admin
        .from("appointments")
        .insert({
          organization_id: ctx.organizationId,
          contact_id: ctx.contactId,
          service: matchedService.name,
          starts_at: startsAtDate.toISOString(),
          ends_at: endsAtDate.toISOString(),
          google_event_id: googleEventId,
          is_new_patient: is_new_patient ?? null,
          full_name,
          phone: ctx.contactPhone,
        })
        .select("id, service, starts_at, ends_at")
        .single();

      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          return { success: true, alreadyExisted: true };
        }
        return { error: "La cita se creo en el calendario pero no se pudo registrar internamente." };
      }

      return { success: true, appointment: inserted };
    },
  });
}
