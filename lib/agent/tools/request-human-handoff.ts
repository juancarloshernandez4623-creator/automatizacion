import { tool } from "ai";
import { z } from "zod";
import type { AgentToolContext } from "./context";

export function createRequestHumanHandoffTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Transfiere la conversacion a un humano: usala cuando el cliente lo pida explicitamente, se moleste, o cuando no puedas resolver su mensaje con la informacion disponible. Tras llamarla, deja de responder automaticamente.",
    inputSchema: z.object({
      reason: z.string().optional().describe("Motivo breve del handoff, para contexto del dueno del negocio."),
    }),
    execute: async ({ reason }) => {
      ctx.handoffState.triggered = true;
      ctx.handoffState.reason = reason;

      if (ctx.sandbox) {
        return { success: true, sandbox: true };
      }

      const { error } = await ctx.admin
        .from("conversations")
        .update({ bot_active: false })
        .eq("id", ctx.conversationId);

      if (error) {
        return { error: "No se pudo desactivar el bot para esta conversacion." };
      }

      // TODO: notificar al dueno mas alla de Supabase Realtime (que ya
      // actualiza /conversaciones en vivo porque bot_active e insertar el
      // mensaje de handoff disparan eventos de postgres_changes). Para v2:
      // email/push cuando el dueno no tenga el dashboard abierto.

      return { success: true };
    },
  });
}
