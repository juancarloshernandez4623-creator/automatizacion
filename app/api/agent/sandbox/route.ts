import { NextResponse } from "next/server";
import { z } from "zod";
import type { ModelMessage } from "ai";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAgent } from "@/lib/agent/run-agent";
import { agentConfigFormSchema } from "@/lib/validations/agent-config";

// IDs ficticios estables: ninguna tool en modo sandbox los usa para leer o
// escribir en la base de datos (ver lib/agent/tools/context.ts), asi que no
// necesitan corresponder a filas reales.
const SANDBOX_CONVERSATION_ID = "00000000-0000-0000-0000-000000000001";
const SANDBOX_CONTACT_ID = "00000000-0000-0000-0000-000000000002";
const SANDBOX_CONTACT_PHONE = "+10000000000";

const requestSchema = z.object({
  agentConfig: agentConfigFormSchema,
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

/**
 * Endpoint del boton "Probar agente" en /personalizacion. Corre `runAgent`
 * con los valores del formulario EN PANTALLA (aun no guardados) para poder
 * previsualizar el comportamiento antes de confirmar cambios. Nunca escribe
 * en `messages`/`conversations`/`appointments` ni toca Google Calendar real
 * (sandbox: true se propaga a las tools).
 *
 * organizationId sale UNICAMENTE de la sesion autenticada (requireCurrentOrg)
 * -- el cliente nunca puede pedir correr el sandbox para otra organizacion,
 * sin importar que mande en el body.
 */
export async function POST(request: Request) {
  const { organizationId } = await requireCurrentOrg();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido." },
      { status: 400 },
    );
  }

  const { agentConfig, history } = parsed.data;

  const historyOverride: ModelMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const admin = createAdminClient();

  try {
    const { replyText, handoffTriggered } = await runAgent({
      admin,
      organizationId,
      conversationId: SANDBOX_CONVERSATION_ID,
      contactId: SANDBOX_CONTACT_ID,
      contactPhone: SANDBOX_CONTACT_PHONE,
      sandbox: true,
      historyOverride,
      agentConfigOverride: agentConfig,
    });

    return NextResponse.json({ replyText, handoffTriggered });
  } catch {
    return NextResponse.json(
      { error: "El agente no pudo generar una respuesta. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
