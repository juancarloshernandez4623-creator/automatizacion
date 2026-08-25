"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { agentConfigFormSchema } from "@/lib/validations/agent-config";
import type { Json } from "@/lib/database.types";

export type SaveAgentConfigState = { error?: string; success?: boolean } | null;

/**
 * Guarda la configuracion del agente. El formulario manda todo el estado
 * estructurado (servicios, horarios, etc.) serializado en un unico campo
 * `payload` porque FormData nativo no representa bien arrays anidados
 * dinamicos -- se valida completo con zod antes de tocar la BD.
 */
export async function saveAgentConfig(
  _prevState: SaveAgentConfigState,
  formData: FormData,
): Promise<SaveAgentConfigState> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { error: "Formulario inválido." };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { error: "Formulario inválido." };
  }

  const result = agentConfigFormSchema.safeParse(parsedJson);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Revisa los campos del formulario." };
  }

  const values = result.data;

  // Dos escrituras porque son dos tablas distintas: el nombre del negocio
  // vive en `organizations` (fuente de verdad compartida con el sidebar y
  // el titulo de la pestana), el resto de la personalizacion del agente
  // vive en `agent_configs`. Se hacen en paralelo, no hay dependencia entre
  // ellas -- si una falla, se reporta igual (ver abajo).
  const [orgResult, agentConfigResult] = await Promise.all([
    supabase.from("organizations").update({ name: values.organizationName }).eq("id", organizationId),
    supabase.from("agent_configs").upsert(
      {
        organization_id: organizationId,
        system_prompt: values.systemPrompt,
        tone: values.tone,
        business_info: values.businessInfo as unknown as Json,
        services: values.services as unknown as Json,
        business_hours: values.businessHours as unknown as Json,
        handoff_message: values.handoffMessage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    ),
  ]);

  if (orgResult.error || agentConfigResult.error) {
    return { error: "No se pudo guardar la configuración." };
  }

  // Revalida todo el layout de la app (no solo esta pagina): el nombre del
  // negocio recien guardado tiene que reflejarse de inmediato en el sidebar
  // y en el titulo de la pestana en cualquier otra pantalla, no solo aqui.
  revalidatePath("/", "layout");
  return { success: true };
}
