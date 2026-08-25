import { tool } from "ai";
import { z } from "zod";
import type { AgentToolContext } from "./context";

export function createSaveContactInfoTool(ctx: AgentToolContext) {
  return tool({
    description:
      "Guarda o actualiza el nombre completo y/o si es cliente nuevo para el contacto actual, en cuanto el cliente los mencione en la conversacion.",
    inputSchema: z.object({
      full_name: z.string().min(1).optional(),
      is_new_patient: z.boolean().optional(),
    }),
    execute: async ({ full_name, is_new_patient }) => {
      if (full_name === undefined && is_new_patient === undefined) {
        return { error: "No se proporciono ningun dato para guardar." };
      }

      if (ctx.sandbox) {
        return { success: true, sandbox: true, saved: { full_name, is_new_patient } };
      }

      const update: Record<string, string | boolean> = {};
      if (full_name !== undefined) update.full_name = full_name;
      if (is_new_patient !== undefined) update.is_new_patient = is_new_patient;

      const { error } = await ctx.admin.from("contacts").update(update).eq("id", ctx.contactId);

      if (error) {
        return { error: "No se pudo guardar la informacion del contacto." };
      }

      return { success: true, saved: update };
    },
  });
}
