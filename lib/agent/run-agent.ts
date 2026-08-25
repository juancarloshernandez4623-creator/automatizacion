import { generateText, stepCountIs, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, Tables } from "@/lib/database.types";
import type { AgentConfigFormValues, BusinessHours, Service } from "@/lib/types";
import { buildSystemPrompt } from "./build-system-prompt";
import { loadConversationHistory } from "./message-history";
import { buildAgentTools } from "./tools";
import {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BUSINESS_INFO,
  DEFAULT_HANDOFF_MESSAGE,
  DEFAULT_SERVICES,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TONE,
} from "./default-templates";

export type RunAgentResult = {
  replyText: string;
  handoffTriggered: boolean;
};

type AgentConfigRow = Tables<"agent_configs">;

function agentConfigRowFromOverride(
  organizationId: string,
  override: AgentConfigFormValues,
): AgentConfigRow {
  return {
    organization_id: organizationId,
    system_prompt: override.systemPrompt,
    tone: override.tone,
    business_info: override.businessInfo as unknown as Json,
    services: override.services as unknown as Json,
    business_hours: override.businessHours as unknown as Json,
    handoff_message: override.handoffMessage,
    updated_at: new Date().toISOString(),
  };
}

function defaultAgentConfigRow(organizationId: string): AgentConfigRow {
  return {
    organization_id: organizationId,
    system_prompt: DEFAULT_SYSTEM_PROMPT,
    tone: DEFAULT_TONE,
    business_info: DEFAULT_BUSINESS_INFO as unknown as Json,
    services: DEFAULT_SERVICES as unknown as Json,
    business_hours: DEFAULT_BUSINESS_HOURS as unknown as Json,
    handoff_message: DEFAULT_HANDOFF_MESSAGE,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Corre el loop de tool-use del agente para una conversacion y devuelve el
 * texto de respuesta final. No envia el mensaje por WhatsApp ni lo persiste
 * -- eso lo hace el caller (el webhook, o el route de sandbox).
 */
export async function runAgent({
  admin,
  organizationId,
  conversationId,
  contactId,
  contactPhone,
  sandbox = false,
  historyOverride,
  agentConfigOverride,
}: {
  admin: SupabaseClient<Database>;
  organizationId: string;
  conversationId: string;
  contactId: string;
  contactPhone: string;
  /** true desde /api/agent/sandbox: las tools con efectos secundarios simulan el resultado. */
  sandbox?: boolean;
  /** Historial ya construido (usado por el sandbox, que no persiste mensajes en BD). */
  historyOverride?: ModelMessage[];
  /**
   * Valores de agent_configs a usar en vez de leerlos de la BD -- el
   * sandbox de /personalizacion los pasa directo desde el formulario en
   * pantalla para poder probar cambios antes de guardarlos.
   */
  agentConfigOverride?: AgentConfigFormValues;
}): Promise<RunAgentResult> {
  const { data: org } = await admin
    .from("organizations")
    .select("name, timezone")
    .eq("id", organizationId)
    .single();

  const organizationTimezone = org?.timezone ?? "America/Mexico_City";
  // El sandbox de /personalizacion manda `agentConfigOverride` con lo que hay
  // en pantalla (sin guardar) -- si trae organizationName, tiene prioridad
  // sobre el de BD, para que el chat de prueba refleje el nombre que se esta
  // escribiendo en ese momento, no el ya guardado.
  const organizationName = agentConfigOverride?.organizationName ?? org?.name ?? "tu negocio";

  let agentConfig: AgentConfigRow;
  if (agentConfigOverride) {
    agentConfig = agentConfigRowFromOverride(organizationId, agentConfigOverride);
  } else {
    const { data: row } = await admin
      .from("agent_configs")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();
    agentConfig = row ?? defaultAgentConfigRow(organizationId);
  }

  const systemPrompt = buildSystemPrompt({ agentConfig, organizationTimezone, organizationName });

  const history = historyOverride ?? (await loadConversationHistory(admin, conversationId));

  const handoffState: { triggered: boolean; reason?: string } = { triggered: false };

  const tools = buildAgentTools({
    admin,
    organizationId,
    organizationTimezone,
    // Los cast pasan por `unknown` a proposito: business_info/services/
    // business_hours son columnas jsonb tipadas genericamente como Json a
    // nivel de BD (ver lib/database.types.ts); esta es la frontera donde se
    // afirma su forma real de aplicacion.
    services: agentConfig.services as unknown as Service[],
    businessHours: agentConfig.business_hours as unknown as BusinessHours,
    conversationId,
    contactId,
    contactPhone,
    sandbox,
    handoffState,
  });

  const result = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: history,
    tools,
    stopWhen: stepCountIs(8),
    temperature: 0.3,
  });

  const replyText = handoffState.triggered
    ? agentConfig.handoff_message
    : result.text || "Disculpa, ¿me lo puedes repetir de otra forma?";

  return { replyText, handoffTriggered: handoffState.triggered };
}
