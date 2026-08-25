import { createGetAvailableSlotsTool } from "./get-available-slots";
import { createBookAppointmentTool } from "./book-appointment";
import { createSaveContactInfoTool } from "./save-contact-info";
import { createRequestHumanHandoffTool } from "./request-human-handoff";
import type { AgentToolContext } from "./context";

export type { AgentToolContext } from "./context";

/**
 * Ensambla el mapa de tools que se le pasa a `generateText`, inyectando el
 * contexto de la conversacion actual (organizacion, contacto, timezone,
 * modo sandbox) por closure en cada una.
 */
export function buildAgentTools(ctx: AgentToolContext) {
  return {
    get_available_slots: createGetAvailableSlotsTool(ctx),
    book_appointment: createBookAppointmentTool(ctx),
    save_contact_info: createSaveContactInfoTool(ctx),
    request_human_handoff: createRequestHumanHandoffTool(ctx),
  };
}
