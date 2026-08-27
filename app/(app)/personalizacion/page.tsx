import { requireCurrentOrg } from "@/lib/auth/current-org";
import type { AgentConfigFormValues, BusinessHours, BusinessInfo, Service } from "@/lib/types";
import {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BUSINESS_INFO,
  DEFAULT_HANDOFF_MESSAGE,
  DEFAULT_SERVICES,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TONE,
} from "@/lib/agent/default-templates";
import { AgentConfigForm } from "./agent-config-form";

export default async function PersonalizacionPage() {
  const { supabase, organizationId } = await requireCurrentOrg();

  const [{ data: config }, { data: organization }] = await Promise.all([
    supabase.from("agent_configs").select("*").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("organizations").select("name, timezone").eq("id", organizationId).single(),
  ]);

  const initialValues: AgentConfigFormValues = {
    // Fuente de verdad unica: `organizations.name` (mismo dato que muestran
    // el sidebar y el titulo de la pestana, ver app/(app)/layout.tsx).
    organizationName: organization?.name ?? "",
    // Igual que name: vive en `organizations.timezone`, la misma columna que
    // usan /citas y todas las tools del agente (get_available_slots,
    // book_appointment) para calcular horarios reales. La columna tiene un
    // default de BD ('America/Mexico_City') que rara vez es el correcto --
    // este campo es lo unico que permite corregirlo desde la UI.
    timezone: organization?.timezone ?? "America/Mexico_City",
    systemPrompt: config?.system_prompt ?? DEFAULT_SYSTEM_PROMPT,
    tone: config?.tone ?? DEFAULT_TONE,
    // Las columnas jsonb (business_info/services/business_hours) se leen
    // como Json genérico a nivel de BD (ver lib/database.types.ts); el cast
    // afirma su forma real de aplicación en el límite de lectura.
    businessInfo: (config?.business_info as unknown as BusinessInfo) ?? DEFAULT_BUSINESS_INFO,
    services: (config?.services as unknown as Service[]) ?? DEFAULT_SERVICES,
    businessHours: (config?.business_hours as unknown as BusinessHours) ?? DEFAULT_BUSINESS_HOURS,
    handoffMessage: config?.handoff_message ?? DEFAULT_HANDOFF_MESSAGE,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Personalización</h1>
        <p className="text-sm text-neutral-500">
          Ajusta cómo se comporta el agente de IA y pruébalo antes de guardar los cambios.
        </p>
      </div>

      <AgentConfigForm initialValues={initialValues} />
    </div>
  );
}
