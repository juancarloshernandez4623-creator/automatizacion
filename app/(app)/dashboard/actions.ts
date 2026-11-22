"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentOrg } from "@/lib/auth/current-org";

/**
 * La recepcion marca a mano que un paciente confirmo su asistencia (p. ej.
 * tras llamarle porque no respondio al recordatorio de WhatsApp).
 */
export async function markAttendanceConfirmed(appointmentId: string): Promise<{ error?: string }> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { error } = await supabase
    .from("appointments")
    .update({ attendance_confirmed_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("organization_id", organizationId)
    .eq("status", "confirmed");

  if (error) {
    return { error: "No se pudo marcar como confirmada." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/citas");
  return {};
}
