import { logger } from "@/lib/logger";
import { createGetAvailableSlotsTool } from "./get-available-slots";
import { createCheckSlotAvailabilityTool } from "./check-slot-availability";
import { createBookAppointmentTool } from "./book-appointment";
import { createSaveContactInfoTool } from "./save-contact-info";
import { createRequestHumanHandoffTool } from "./request-human-handoff";
import type { AgentToolContext } from "./context";

export type { AgentToolContext } from "./context";

/**
 * Envuelve cada tool para loguear (via `logger`, visible en los logs de
 * Vercel) el input exacto que le mando el modelo y el resultado que
 * devolvio, con el nombre de la tool y la organizacion. Sin esto, cuando el
 * agente "se equivoca" (ej. dice que no hay disponibilidad) no habia forma
 * de saber si el fallo estaba en la tool (datos/logica reales) o en el
 * modelo (no llamo a la tool, o la llamo con parametros distintos a los
 * esperados) -- ahora mismo la unica manera de distinguirlo era pedirle al
 * usuario que reprodujera el bug y adivinar. `any` aqui es deliberado: cada
 * tool tiene su propio input/output tipado por su propio schema de Zod, y
 * esta envoltura es genuinamente generica sobre todas ellas -- tipar esto
 * como union perderia la genericidad sin aportar seguridad real (el `catch`
 * ya cubre cualquier fallo en tiempo de ejecucion).
 */
function withLogging<T extends Record<string, { execute?: (...args: any[]) => any }>>(
  tools: T,
  organizationId: string,
): T {
  const wrapped: Record<string, unknown> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    const originalExecute = toolDef.execute;
    if (!originalExecute) {
      wrapped[name] = toolDef;
      continue;
    }
    wrapped[name] = {
      ...toolDef,
      execute: async (input: unknown, options: unknown) => {
        const startedAt = Date.now();
        try {
          const result = await originalExecute(input, options);
          logger.info({
            event: "agent_tool_call",
            organization_id: organizationId,
            tool: name,
            input,
            result,
            latency_ms: Date.now() - startedAt,
          });
          return result;
        } catch (err) {
          logger.error({
            event: "agent_tool_call_error",
            organization_id: organizationId,
            tool: name,
            input,
            error: err instanceof Error ? err.message : String(err),
            latency_ms: Date.now() - startedAt,
          });
          throw err;
        }
      },
    };
  }
  return wrapped as T;
}

/**
 * Ensambla el mapa de tools que se le pasa a `generateText`, inyectando el
 * contexto de la conversacion actual (organizacion, contacto, timezone,
 * modo sandbox) por closure en cada una.
 */
export function buildAgentTools(ctx: AgentToolContext) {
  const tools = {
    get_available_slots: createGetAvailableSlotsTool(ctx),
    check_slot_availability: createCheckSlotAvailabilityTool(ctx),
    book_appointment: createBookAppointmentTool(ctx),
    save_contact_info: createSaveContactInfoTool(ctx),
    request_human_handoff: createRequestHumanHandoffTool(ctx),
  };
  return withLogging(tools, ctx.organizationId);
}
