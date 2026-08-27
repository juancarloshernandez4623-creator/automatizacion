import { z } from "zod";
import { WEEKDAYS } from "@/lib/types";

const timeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
});

const businessHoursSchema = z.object(
  Object.fromEntries(WEEKDAYS.map((day) => [day, z.array(timeRangeSchema)])) as Record<
    (typeof WEEKDAYS)[number],
    z.ZodArray<typeof timeRangeSchema>
  >,
);

const serviceSchema = z.object({
  name: z.string().min(1, "El servicio necesita un nombre"),
  duration_minutes: z.number().int().min(5).max(480),
  description: z.string().optional(),
});

export const agentConfigFormSchema = z.object({
  // Nombre del negocio: se guarda en `organizations.name`, no dentro de
  // `businessInfo` (ver lib/types.ts) -- por eso vive a este nivel, junto a
  // los demas campos que la action reparte entre las dos tablas.
  organizationName: z.string().min(1, "El nombre del negocio no puede estar vacío"),
  timezone: z.string().min(1, "Selecciona la zona horaria del negocio"),
  systemPrompt: z.string().min(1, "El prompt del sistema no puede estar vacío"),
  tone: z.string().min(1, "Describe el tono del agente"),
  businessInfo: z.object({
    address: z.string(),
    phone: z.string(),
    description: z.string(),
    faq: z.string(),
  }),
  services: z.array(serviceSchema).min(1, "Agrega al menos un servicio"),
  businessHours: businessHoursSchema,
  handoffMessage: z.string().min(1, "Escribe el mensaje de handoff a un humano"),
});
