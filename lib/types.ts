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
  systemPrompt: string;
  tone: string;
  businessInfo: BusinessInfo;
  services: Service[];
  businessHours: BusinessHours;
  handoffMessage: string;
};

export type SlotSuggestion = {
  /** ISO 8601 con offset, en la timezone de la organizacion. */
  startsAt: string;
  endsAt: string;
};

export function emptyBusinessHours(): BusinessHours {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}
