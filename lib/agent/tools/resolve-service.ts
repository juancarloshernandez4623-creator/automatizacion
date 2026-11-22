import type { Service } from "@/lib/types";
import type { AgentToolContext } from "./context";

/** Duracion por defecto de un tratamiento pautado que no esta en la lista de servicios. */
export const DEFAULT_PRESCRIBED_TREATMENT_MINUTES = 60;

export type ResolvedService = {
  /** Nombre con el que se guarda la cita. */
  name: string;
  durationMinutes: number;
  booking: NonNullable<Service["booking"]>;
  /**
   * false = no esta en la lista de servicios de la clinica: es un
   * tratamiento que el paciente dice tener pautado (endodoncia, extraccion,
   * corona...). Se reserva con su nombre y la duracion por defecto, marcada
   * como estimada para que la recepcion la revise.
   */
  inCatalog: boolean;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Traduce el servicio que pide el modelo a uno de la clinica. Tolera
 * variaciones ("Limpieza dental" -> "limpieza", acentos, mayusculas) para
 * que un nombre algo distinto no se confunda con un tratamiento nuevo; solo
 * lo que de verdad no se parece a ningun servicio se trata como tratamiento
 * pautado fuera de la lista.
 */
export function resolveService(ctx: AgentToolContext, requested: string): ResolvedService {
  const wanted = normalize(requested);

  const exact = ctx.services.find((s) => normalize(s.name) === wanted);
  const partial =
    exact ??
    ctx.services.find((s) => {
      const name = normalize(s.name);
      return name.length >= 4 && (wanted.includes(name) || name.includes(wanted));
    });

  if (partial) {
    return {
      name: partial.name,
      durationMinutes: partial.duration_minutes,
      booking: partial.booking ?? "direct",
      inCatalog: true,
    };
  }

  return {
    name: capitalize(requested.trim()),
    durationMinutes: ctx.prescribedTreatmentMinutes,
    booking: "after_assessment",
    inCatalog: false,
  };
}
