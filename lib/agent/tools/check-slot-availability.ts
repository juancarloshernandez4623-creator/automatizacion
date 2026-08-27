import { tool } from "ai";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { getFreeBusySlots, isSlotAvailable } from "@/lib/google/freebusy";
import type { AgentToolContext } from "./context";

const REASON_LABEL: Record<"past" | "outside_business_hours" | "busy", string> = {
  past: "esa fecha/hora ya pasó",
  outside_business_hours: "está fuera del horario de atención de ese día",
  busy: "ya está ocupado en el calendario",
};

/**
 * Complementa a get_available_slots: esa otra tool solo SUGIERE huecos (los
 * primeros que encuentra), nunca confirma un horario concreto propuesto por
 * el cliente. Sin esta tool, cuando alguien pedia una hora que no viniera de
 * las sugerencias (ej. "¿puede ser a las 17:30?"), el agente no tenia forma
 * de comprobarlo y terminaba inventando un "no disponible" por precaucion.
 */
export function createCheckSlotAvailabilityTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Comprueba si un horario EXACTO propuesto por el cliente (una fecha y hora concretas que el cliente menciono, no necesariamente uno de los sugeridos por get_available_slots) esta realmente libre, contra el horario de atencion real y el calendario real. Usa esta tool SIEMPRE que el cliente proponga su propia fecha/hora en vez de elegir una de las sugeridas -- nunca respondas que un horario no esta disponible sin haber llamado a esta tool primero, y nunca lo confirmes como disponible sin que esta tool devuelva available:true.",
    inputSchema: z.object({
      service: z
        .string()
        .describe("Nombre exacto del servicio, tal como aparece en la lista de servicios disponibles."),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-MM-dd")
        .describe("Fecha solicitada por el cliente, en la zona horaria del negocio."),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Formato HH:mm")
        .describe("Hora solicitada por el cliente, en la zona horaria del negocio."),
    }),
    execute: async ({ service, date, time }) => {
      const matchedService = ctx.services.find(
        (s) => s.name.trim().toLowerCase() === service.trim().toLowerCase(),
      );
      if (!matchedService) {
        return {
          error: `No reconozco el servicio "${service}". Servicios disponibles: ${ctx.services
            .map((s) => s.name)
            .join(", ")}.`,
        };
      }

      const startsAtDate = fromZonedTime(`${date}T${time}:00`, ctx.organizationTimezone);
      if (Number.isNaN(startsAtDate.getTime())) {
        return { error: "Fecha u hora inválidas." };
      }

      const calendarClient = await getOrgCalendarClient(ctx.admin, ctx.organizationId);
      if (!calendarClient) {
        return {
          error:
            "Este negocio aun no ha conectado su Google Calendar, no puedo comprobar disponibilidad todavia.",
        };
      }

      const result = await isSlotAvailable({
        calendar: calendarClient.calendar,
        calendarId: calendarClient.calendarId,
        businessHours: ctx.businessHours,
        startsAt: startsAtDate,
        durationMinutes: matchedService.duration_minutes,
        timezone: ctx.organizationTimezone,
      });

      if (result.available) {
        const endsAtDate = new Date(startsAtDate.getTime() + matchedService.duration_minutes * 60_000);
        return {
          available: true,
          service: matchedService.name,
          starts_at: startsAtDate.toISOString(),
          ends_at: endsAtDate.toISOString(),
        };
      }

      // Ofrece alternativas cercanas a partir de esa misma fecha, para no
      // dejar al cliente sin opciones tras un "no".
      const alternatives = await getFreeBusySlots({
        calendar: calendarClient.calendar,
        calendarId: calendarClient.calendarId,
        businessHours: ctx.businessHours,
        durationMinutes: matchedService.duration_minutes,
        timezone: ctx.organizationTimezone,
        searchFrom: startsAtDate,
      });

      return {
        available: false,
        reason: REASON_LABEL[result.reason],
        alternatives,
      };
    },
  });
}
