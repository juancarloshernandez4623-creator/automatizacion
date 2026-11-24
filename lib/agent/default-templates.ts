import type { BusinessHours, BusinessInfo, BusinessType, Service } from "@/lib/types";

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

/**
 * Servicios por defecto de una clinica o centro estetico (catalogo amplio:
 * cada centro quita lo que no ofrece y ajusta duraciones).
 *
 * Criterio de reserva:
 * - "after_assessment" (valoracion medica la primera vez): todo lo que
 *   inyecta, perfora la piel, usa laser o aparatologia medica, o exige
 *   revisar contraindicaciones -- lo decide y aplica un medico.
 * - "direct": tratamientos esteticos sin componente medico (faciales,
 *   cejas y pestanas, depilacion, masajes, corporales esteticos, unas).
 *
 * Fuente de verdad: /admin/invites aplica esta lista al crear un centro
 * estetico (la del trigger SQL de la migracion 0018 es solo un minimo de
 * respaldo).
 */
const d = (name: string, duration_minutes: number, description: string): Service => ({
  name, duration_minutes, description, booking: "direct",
});
const m = (name: string, duration_minutes: number, description: string): Service => ({
  name, duration_minutes, description, booking: "after_assessment",
});

export const DEFAULT_SERVICES_AESTHETIC: Service[] = [
  {
    name: "primera consulta / valoración",
    duration_minutes: 30,
    description: "Consulta con el médico estético para valorar el tratamiento adecuado y descartar contraindicaciones",
    booking: "assessment",
  },

  // Medicina estética facial (valoración médica previa)
  m("toxina botulínica (bótox)", 30, "Arrugas de expresión: frente, entrecejo y patas de gallo"),
  m("ácido hialurónico – labios", 45, "Aumento, perfilado o hidratación de labios"),
  m("ácido hialurónico – surcos, pómulos y mentón", 45, "Relleno de surcos nasogenianos, volumen de pómulos y mentón"),
  m("rinomodelación", 45, "Corrección de la nariz sin cirugía con ácido hialurónico"),
  m("tratamiento de ojeras", 45, "Relleno de la ojera con ácido hialurónico"),
  m("hilos tensores", 60, "Efecto lifting sin cirugía"),
  m("bioestimuladores de colágeno", 45, "Radiesse, Sculptra u otros para la flacidez"),
  m("skinbooster / Profhilo", 45, "Hidratación profunda y calidad de la piel"),
  m("mesoterapia facial", 45, "Vitaminas y ácido hialurónico para revitalizar la piel"),
  m("plasma rico en plaquetas (PRP)", 60, "Rejuvenecimiento facial con plasma del propio paciente"),
  m("peeling médico", 45, "Peeling químico medio o profundo para manchas, acné y arrugas"),
  m("microneedling / dermapen", 60, "Microagujas para cicatrices, poros y textura de la piel"),
  m("enzimas o lipolíticos para papada", 30, "Reducción de grasa localizada en papada"),
  m("hiperhidrosis (sudoración excesiva)", 30, "Toxina botulínica en axilas, manos o pies"),

  // Láser y luz médica (valoración médica previa)
  m("láser para manchas (IPL)", 45, "Manchas solares, pigmentación y rojeces"),
  m("láser CO2 / fraccionado", 60, "Rejuvenecimiento, cicatrices de acné y textura"),
  m("eliminación de tatuajes con láser", 30, "Sesión de eliminación de tatuaje"),
  m("tratamiento de varices / arañas vasculares", 30, "Escleroterapia o láser vascular"),

  // Capilar (valoración médica previa)
  m("mesoterapia capilar / PRP capilar", 45, "Tratamiento médico de la caída del cabello"),

  // Medicina estética corporal (valoración médica previa)
  m("criolipólisis", 60, "Eliminación de grasa localizada por frío"),
  m("mesoterapia corporal", 45, "Celulitis y grasa localizada"),
  m("carboxiterapia", 45, "Celulitis, flacidez y ojeras"),

  // Estética facial (reserva directa)
  d("limpieza facial profunda", 60, "Higiene facial completa con extracción"),
  d("higiene facial express", 30, "Limpieza facial rápida"),
  d("hidratación facial / Hydrafacial", 60, "Limpieza, exfoliación e hidratación profunda"),
  d("tratamiento facial antiacné", 60, "Limpieza y tratamiento para pieles con acné"),
  d("peeling químico superficial", 45, "Renovación suave de la piel"),
  d("microdermoabrasión", 45, "Exfoliación mecánica de la piel"),
  d("radiofrecuencia facial", 45, "Tensado y firmeza de la piel"),
  d("tratamiento facial antiedad", 60, "Tratamiento de cabina reafirmante y antiarrugas"),

  // Cejas y pestañas (reserva directa)
  d("diseño y depilación de cejas", 30, "Diseño de cejas con cera o pinza"),
  d("laminado de cejas", 45, "Alisado y fijación de las cejas"),
  d("lifting de pestañas", 60, "Rizado y tinte de pestañas naturales"),
  d("extensiones de pestañas", 90, "Primera puesta de extensiones"),
  d("relleno de extensiones de pestañas", 60, "Mantenimiento de extensiones"),

  // Depilación (reserva directa)
  d("depilación láser – zona pequeña", 20, "Axilas, labio superior, ingles... La primera sesión incluye prueba"),
  d("depilación láser – zona mediana", 30, "Medias piernas, brazos, ingle completa..."),
  d("depilación láser – zona grande", 45, "Piernas completas, espalda..."),
  d("depilación con cera", 30, "Depilación tradicional con cera"),

  // Corporal estético y masajes (reserva directa)
  d("presoterapia", 45, "Drenaje y piernas cansadas"),
  d("radiofrecuencia corporal", 45, "Flacidez y celulitis"),
  d("cavitación", 45, "Reducción de grasa localizada con ultrasonidos"),
  d("maderoterapia", 60, "Masaje reductor y anticelulítico con instrumentos de madera"),
  d("tratamiento reductor / anticelulítico", 60, "Tratamiento corporal de cabina"),
  d("drenaje linfático manual", 60, "Retención de líquidos y piernas cansadas"),
  d("masaje relajante", 60, "Masaje corporal relajante"),
  d("masaje descontracturante", 60, "Masaje para tensión y contracturas"),

  // Manos y pies (reserva directa)
  d("manicura", 45, "Manicura tradicional"),
  d("manicura semipermanente", 60, "Esmaltado semipermanente"),
  d("pedicura", 60, "Pedicura estética"),
];

export function defaultServicesFor(type: BusinessType): Service[] {
  return type === "aesthetic" ? DEFAULT_SERVICES_AESTHETIC : DEFAULT_SERVICES;
}

/** Valoracion que se usa si la clinica no ha configurado una propia (ver run-agent.ts). */
export function fallbackAssessmentFor(type: BusinessType): Service {
  return type === "aesthetic"
    ? DEFAULT_SERVICES_AESTHETIC[0]!
    : {
        name: "primera visita / valoración",
        duration_minutes: 30,
        description: "Exploración y diagnóstico para pacientes nuevos o con dolor/molestias",
        booking: "assessment",
      };
}

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
