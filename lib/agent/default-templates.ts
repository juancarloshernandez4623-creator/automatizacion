import type { BusinessHours, BusinessInfo, Service } from "@/lib/types";

/**
 * Valores por defecto orientados a una clinica dental, usados como:
 *  1. Fallback en build-system-prompt.ts si una organizacion no tiene
 *     agent_configs todavia (no deberia pasar, ver el trigger de signup).
 *  2. Contenido inicial del formulario de /personalizacion antes de guardar.
 *
 * MANTENER EN SYNC con los valores por defecto insertados por el trigger
 * `private.handle_new_user()` (ultima version en
 * supabase/migrations/0017_reminders_and_assessment_services.sql)
 * y con supabase/seed.sql -- estan duplicados a proposito (SQL vs TS no
 * comparten codigo), pero deben decir lo mismo.
 */

export const DEFAULT_SYSTEM_PROMPT =
  "Eres el asistente virtual de un negocio. Saluda con calidez, entiende el motivo de contacto del cliente y ayudalo a agendar una cita si lo necesita. Se breve y claro en tus mensajes de WhatsApp.";

export const DEFAULT_TONE = "profesional y cálido";

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  address: "",
  phone: "",
  description: "",
  faq: "",
};

export const DEFAULT_SERVICES: Service[] = [
  {
    name: "primera visita / valoración",
    duration_minutes: 30,
    description: "Exploración y diagnóstico para pacientes nuevos o con dolor/molestias",
    booking: "assessment",
  },
  { name: "limpieza", duration_minutes: 30, description: "Limpieza dental de rutina", booking: "direct" },
  { name: "empaste", duration_minutes: 45, description: "Empaste dental", booking: "after_assessment" },
  { name: "blanqueamiento", duration_minutes: 60, description: "Blanqueamiento dental", booking: "after_assessment" },
];

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon: [{ start: "09:00", end: "18:00" }],
  tue: [{ start: "09:00", end: "18:00" }],
  wed: [{ start: "09:00", end: "18:00" }],
  thu: [{ start: "09:00", end: "18:00" }],
  fri: [{ start: "09:00", end: "18:00" }],
  sat: [],
  sun: [],
};

export const DEFAULT_HANDOFF_MESSAGE = "Te paso con un humano en un momento.";
