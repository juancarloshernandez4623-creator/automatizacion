import { tool } from "ai";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { getOrgCalendarClient } from "@/lib/google/calendar-client";
import { getFreeBusySlots } from "@/lib/google/freebusy";
import type { AgentToolContext } from "./context";

export function createGetAvailableSlotsTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Devuelve hasta 3 horarios REALES disponibles para un servicio, calculados contra el horario de atencion del negocio y el calendario de Google (no inventes horarios que no vengan de esta tool). Si el cliente pide una fecha o rango futuro concreto (ej. 'la semana que viene', 'en marzo', 'el dia 15'), pasa earliest_date -- si lo omites, la busqueda siempre arranca hoy y puede no llegar nunca a esa fecha si ya hay huecos libres antes.",
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
        .describe(
          "Tamano de la ventana de busqueda en dias, contando desde earliest_date (o desde hoy si no se manda earliest_date). Por defecto 7. Esto NO mueve el inicio de la busqueda, solo su alcance -- para buscar mas adelante en el tiempo usa earliest_date.",
        ),
      earliest_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-MM-dd")
        .optional()
        .describe(
          "Fecha (yyyy-MM-dd, en la zona horaria del negocio) a partir de la cual buscar, cuando el cliente pidio explicitamente un dia, semana o mes futuro. Omitir para 'lo antes posible'. Si la fecha ya paso, se ignora y se busca desde ahora.",
        ),
    }),
    execute: async ({ service, days_ahead, earliest_date }) => {
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

      const searchFrom = earliest_date
        ? fromZonedTime(`${earliest_date}T00:00:00`, ctx.organizationTimezone)
        : undefined;

      const slots = await getFreeBusySlots({
        calendar: calendarClient.calendar,
        calendarId: calendarClient.calendarId,
        businessHours: ctx.businessHours,
        durationMinutes: matchedService.duration_minutes,
        daysAhead: days_ahead ?? 7,
        timezone: ctx.organizationTimezone,
        searchFrom,
      });

      if (slots.length === 0) {
        return {
          error: earliest_date
            ? `No encontre horarios libres a partir del ${earliest_date} para ese servicio dentro de los siguientes ${days_ahead ?? 7} dias. Ofrece ampliar el rango o contactar al negocio directamente.`
            : "No encontre horarios libres en los proximos dias para ese servicio. Ofrece contactar al negocio directamente o intenta con otro rango.",
        };
      }

      return { service: matchedService.name, duration_minutes: matchedService.duration_minutes, slots };
    },
  });
}
