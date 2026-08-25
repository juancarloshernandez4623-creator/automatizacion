import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { BusinessHours, Service } from "@/lib/types";

/**
 * Contexto compartido inyectado por closure en cada tool (ver
 * lib/agent/tools/index.ts). Cada invocacion de runAgent crea un
 * AgentToolContext nuevo -- nunca se reutiliza entre requests.
 */
export type AgentToolContext = {
  admin: SupabaseClient<Database>;
  organizationId: string;
  organizationTimezone: string;
  services: Service[];
  businessHours: BusinessHours;
  conversationId: string;
  contactId: string;
  /** E.164, ej "+5215500000001". */
  contactPhone: string;
  /**
   * true cuando el agente corre desde el sandbox de /personalizacion
   * ("Probar agente"): las tools con efectos secundarios reales
   * (book_appointment, save_contact_info) simulan el resultado sin escribir
   * en la base de datos ni tocar Google Calendar.
   */
  sandbox: boolean;
  /**
   * Mutado por la tool request_human_handoff para que runAgent sepa, tras
   * terminar el loop, que debe reemplazar la respuesta final por el
   * handoff_message configurado (en vez de lo ultimo que haya generado el
   * modelo) y detener el envio de mas mensajes automaticos.
   */
  handoffState: { triggered: boolean; reason?: string };
};
