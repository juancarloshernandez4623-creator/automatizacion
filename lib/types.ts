/**
 * Tipos de aplicacion (no ligados 1:1 a una columna de la BD) para el
 * contenido de las columnas jsonb de `agent_configs` y utilidades
 * compartidas entre el agente, las tools y los formularios de
 * /personalizacion.
 */

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

export type TimeRange = {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

export type BusinessHours = Record<Weekday, TimeRange[]>;

export type Service = {
  name: string;
  duration_minutes: number;
  description?: string;
};

// El nombre del negocio NO vive aqui -- vive en `organizations.name` (una
// sola fuente de verdad, la misma que usan el sidebar y el titulo de la
// pestana, ver app/(app)/layout.tsx). Antes habia un `name` duplicado aqui
// que se guardaba aparte y nunca se sincronizaba con el resto de la app.
export type BusinessInfo = {
  address: string;
  phone: string;
  description: string;
  faq: string;
};

export type AgentConfigFormValues = {
  organizationName: string;
  /** IANA timezone, ej. "Europe/Madrid". Vive en `organizations.timezone`,
   * no en `agent_configs` -- misma logica que `organizationName` (ver
   * comentario de BusinessInfo mas abajo): una sola fuente de verdad,
   * compartida con /citas y el agente (get_available_slots, book_appointment). */
  timezone: string;
  systemPrompt: string;
  tone: string;
  businessInfo: BusinessInfo;
  services: Service[];
  businessHours: BusinessHours;
  handoffMessage: string;
};

/** Zonas horarias mas comunes para negocios hispanohablantes. La lista no
 * pretende ser exhaustiva (hay ~400 zonas IANA) -- cubre los paises mas
 * probables; si un negocio necesita otra, puede escribirla directamente
 * (el select acepta cualquier string igualmente via <option> custom). */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "Europe/Madrid", label: "España — Madrid (peninsular y Baleares)" },
  { value: "Atlantic/Canary", label: "España — Canarias" },
  { value: "America/Mexico_City", label: "México — Ciudad de México" },
  { value: "America/Bogota", label: "Colombia — Bogotá" },
  { value: "America/Lima", label: "Perú — Lima" },
  { value: "America/Santiago", label: "Chile — Santiago" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina — Buenos Aires" },
  { value: "America/Montevideo", label: "Uruguay — Montevideo" },
  { value: "America/Caracas", label: "Venezuela — Caracas" },
  { value: "America/Guayaquil", label: "Ecuador — Guayaquil" },
  { value: "America/La_Paz", label: "Bolivia — La Paz" },
  { value: "America/Asuncion", label: "Paraguay — Asunción" },
  { value: "America/Santo_Domingo", label: "República Dominicana — Santo Domingo" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/Guatemala", label: "Guatemala" },
  { value: "America/El_Salvador", label: "El Salvador" },
  { value: "America/Tegucigalpa", label: "Honduras" },
  { value: "America/Managua", label: "Nicaragua" },
  { value: "America/New_York", label: "EE. UU. — Este (Nueva York, Miami)" },
  { value: "America/Chicago", label: "EE. UU. — Central" },
  { value: "America/Denver", label: "EE. UU. — Montaña" },
  { value: "America/Los_Angeles", label: "EE. UU. — Pacífico" },
];

export type SlotSuggestion = {
  /** ISO 8601 con offset, en la timezone de la organizacion. */
  startsAt: string;
  endsAt: string;
};

export function emptyBusinessHours(): BusinessHours {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}
