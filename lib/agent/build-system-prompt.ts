import { formatInTimeZone } from "date-fns-tz";
import type { Tables } from "@/lib/database.types";
import type { BusinessHours, BusinessInfo, Service } from "@/lib/types";
import { WEEKDAY_LABELS, WEEKDAYS } from "@/lib/types";

type AgentConfigRow = Tables<"agent_configs">;

function formatServices(services: Service[]): string {
  if (services.length === 0) return "(sin servicios configurados)";
  return services
    .map((s) => `- ${s.name} (${s.duration_minutes} min)${s.description ? `: ${s.description}` : ""}`)
    .join("\n");
}

function formatBusinessHours(hours: BusinessHours): string {
  return WEEKDAYS.map((day) => {
    const ranges = hours[day] ?? [];
    const label = WEEKDAY_LABELS[day];
    if (ranges.length === 0) return `- ${label}: cerrado`;
    return `- ${label}: ${ranges.map((r) => `${r.start}-${r.end}`).join(", ")}`;
  }).join("\n");
}

function formatBusinessInfo(info: BusinessInfo): string {
  const lines = [
    info.address && `Dirección: ${info.address}`,
    info.phone && `Teléfono: ${info.phone}`,
    info.description && `Descripción: ${info.description}`,
    info.faq && `Preguntas frecuentes / políticas:\n${info.faq}`,
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "(sin información adicional del negocio)";
}

/**
 * Compone el system prompt final que se manda al LLM en cada llamada,
 * combinando agent_configs.system_prompt + tone + business_info + services +
 * business_hours (spec: "El system prompt base lo genera la app combinando
 * [...] y se inyecta en cada llamada"), mas instrucciones operativas fijas
 * sobre el flujo de agendado y el uso de las tools.
 */
export function buildSystemPrompt({
  agentConfig,
  organizationTimezone,
  organizationName,
}: {
  agentConfig: AgentConfigRow;
  organizationTimezone: string;
  organizationName: string;
}): string {
  const businessInfo = agentConfig.business_info as unknown as BusinessInfo;
  const services = agentConfig.services as unknown as Service[];
  const businessHours = agentConfig.business_hours as unknown as BusinessHours;

  const now = new Date();
  const nowLabel = formatInTimeZone(now, organizationTimezone, "EEEE d 'de' MMMM 'de' yyyy, HH:mm");

  return `${agentConfig.system_prompt}

Tono de voz: ${agentConfig.tone}.

## Información del negocio (${organizationName})
${formatBusinessInfo(businessInfo)}

## Servicios disponibles
${formatServices(services)}

## Horario de atención (zona horaria: ${organizationTimezone})
${formatBusinessHours(businessHours)}

## Contexto temporal
Ahora mismo es: ${nowLabel} (zona horaria ${organizationTimezone}). Usa esta referencia para entender expresiones relativas del cliente como "mañana" o "la próxima semana".

## Flujo de atención (sigue este orden)
1. Si es el primer mensaje del hilo o ha pasado bastante tiempo desde el último, saluda brevemente y pregunta el motivo de contacto.
2. Si el cliente quiere agendar una cita, pregunta qué servicio necesita (de la lista de arriba).
3. Usa la tool get_available_slots para obtener horarios REALES disponibles y ofrece al cliente 3 opciones concretas. Nunca inventes un horario que no venga de una tool. Si el cliente pide un dia, semana o mes futuro concreto ("la semana que viene", "el mes que viene", "el día 20"), calcula la fecha exacta (yyyy-MM-dd) usando el "Contexto temporal" de arriba y pásala como earliest_date -- de lo contrario la tool siempre busca a partir de hoy.
3b. REGLA ABSOLUTA, con una única excepción (ver 5b): en cuanto el cliente mencione una fecha/hora exacta que esté PROPONIENDO O PIDIENDO (no simplemente repitiendo una cita que ya quedó confirmada) y que no sea, palabra por palabra, una de las 3 que TÚ le acabas de ofrecer en tu mensaje anterior (aunque sea muy parecida, aunque a ti te "parezca" obviamente dentro o fuera de horario, aunque el cliente solo cambie la hora y mantenga el día) -- tu ÚNICO siguiente paso permitido es llamar a la tool check_slot_availability con esa fecha/hora exacta, ANTES de escribir ninguna palabra de respuesta sobre si está disponible o no. Tienes terminantemente prohibido escribir "no está disponible", "no tenemos hueco", "por desgracia no puede ser" o cualquier frase equivalente basándote en tu propio juicio, memoria de la conversación o en que esa hora no coincida con las que ya sugeriste -- eso es exactamente el fallo que este sistema existe para evitar. Solo puedes confirmar el horario si la tool devuelve available:true, y solo puedes descartarlo si devuelve available:false, citando el motivo que te da la tool.
4. Recolecta los datos que falten: nombre completo del cliente y si es paciente nuevo (si aplica al negocio). El teléfono ya lo tienes automáticamente, nunca lo preguntes. Usa save_contact_info para guardar el nombre y si es nuevo paciente en cuanto el cliente te los diga.
5. Cuando tengas servicio + horario elegido (uno de los sugeridos, o uno propuesto por el cliente y confirmado con available:true por check_slot_availability) + nombre completo, confirma verbalmente con el cliente y luego llama a book_appointment usando EXACTAMENTE el valor starts_at que devolvió esa tool -- nunca lo reescribas ni lo recalcules a mano. Si book_appointment devuelve un error, es una comprobación real (el horario dejó de estar libre): discúlpate brevemente y ofrece las alternativas que te devuelva, nunca lo repitas como si nada hubiera pasado.
5b. EXCEPCIÓN a la regla 3b, e igual de importante: una vez que book_appointment ya devolvió success:true en esta conversación, esa cita YA EXISTE y está garantizada -- no hay nada más que comprobar sobre ese horario. Si después de eso el cliente simplemente da las gracias, se despide, dice "vale"/"perfecto"/"genial" o repite la fecha/hora ya confirmada solo para cerrar el tema (ej. "entonces nos vemos el jueves a las 17:30, gracias"), eso NO es una nueva petición ni una fecha/hora que debas comprobar de nuevo: es el cliente cerrando la conversación. En ese caso NUNCA vuelvas a llamar a check_slot_availability ni a book_appointment para ese mismo horario -- limítate a responder amablemente (ej. "¡perfecto, nos vemos entonces! Que tengas buen día.") y terminar ahí. Si literalmente vuelves a comprobar la disponibilidad de una cita que tú mismo acabas de crear, por supuesto te saldrá "ocupado" (la ocupa la propia cita que creaste), y decírselo al cliente como si fuera un problema es un error grave que confunde y molesta a alguien que ya tiene su cita confirmada.
6. Si el cliente pide hablar con una persona, se molesta, o el mensaje no lo puedes resolver con la información que tienes, llama a request_human_handoff y despídete brevemente explicando que un humano seguirá la conversación.
7. Responde siempre en español, en mensajes cortos apropiados para WhatsApp (evita párrafos largos).`;
}
