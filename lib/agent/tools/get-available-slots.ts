import { tool } from "ai";
import { z } from "zod";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { getFreeBusySlots } from "@/lib/google/freebusy";
import type { AgentToolContext } from "./context";

export function createGetAvailableSlotsTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Devuelve hasta 3 horarios REALES disponibles para un servicio, calculados contra el horario de atencion del negocio y el calendario de Google (no inventes horarios que no vengan de esta tool).",
    inputSchema: z.object({
      service: z
        .string()
        .describe("Nombre exacto del servicio, tal como aparece en la lista de servicios disponibles."),
      days_ahead: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .describe("Cuantos dias hacia adelante buscar. Por defecto 7."),
    }),
    execute: async ({ service, days_ahead }) => {
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

      const calendarClient = await getOrgCalendarClient(ctx.admin, ctx.organizationId);
      if (!calendarClient) {
        return {
          error:
            "Este negocio aun no ha conectado su Google Calendar, no puedo consultar horarios disponibles todavia.",
        };
      }

      const slots = await getFreeBusySlots({
        calendar: calendarClient.calendar,
        calendarId: calendarClient.calendarId,
        businessHours: ctx.businessHours,
        durationMinutes: matchedService.duration_minutes,
        daysAhead: days_ahead ?? 7,
        timezone: ctx.organizationTimezone,
      });

      if (slots.length === 0) {
        return {
          error:
            "No encontre horarios libres en los proximos dias para ese servicio. Ofrece contactar al negocio directamente o intenta con otro rango.",
        };
      }

      return { service: matchedService.name, duration_minutes: matchedService.duration_minutes, slots };
    },
  });
}
