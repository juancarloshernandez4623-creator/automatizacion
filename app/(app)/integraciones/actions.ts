"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { encrypt, decrypt } from "@/lib/crypto";
import { GRAPH_API_BASE } from "@/lib/whatsapp/constants";

export type IntegrationsActionState = {
  error?: string;
  success?: string;
};

const whatsappConfigSchema = z.object({
  phoneNumberId: z.string().trim().min(1, "Phone Number ID requerido"),
  wabaId: z.string().trim().min(1, "WABA ID requerido"),
  accessToken: z.string().trim().min(1, "Access token requerido"),
  verifyToken: z.string().trim().min(1, "Verify token requerido"),
  appSecret: z.string().trim().min(1, "App secret requerido"),
});

export async function saveWhatsAppConfig(
  _prevState: IntegrationsActionState,
  formData: FormData,
): Promise<IntegrationsActionState> {
  const parsed = whatsappConfigSchema.safeParse({
    phoneNumberId: formData.get("phoneNumberId"),
    wabaId: formData.get("wabaId"),
    accessToken: formData.get("accessToken"),
    verifyToken: formData.get("verifyToken"),
    appSecret: formData.get("appSecret"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const { supabase, organizationId } = await requireCurrentOrg();

  const { error } = await supabase.from("whatsapp_configs").upsert({
    organization_id: organizationId,
    phone_number_id: parsed.data.phoneNumberId,
    waba_id: parsed.data.wabaId,
    access_token_encrypted: encrypt(parsed.data.accessToken),
    verify_token: parsed.data.verifyToken,
    app_secret_encrypted: encrypt(parsed.data.appSecret),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    // El unique index de phone_number_id/verify_token puede rechazar el
    // upsert si otro negocio ya registro el mismo numero o token.
    if (error.code === "23505") {
      return {
        error:
          "Ese Phone Number ID o Verify Token ya esta en uso por otra cuenta. Verifica los valores.",
      };
    }
    return { error: "No pudimos guardar la configuracion de WhatsApp." };
  }

  revalidatePath("/integraciones");
  return { success: "Configuracion de WhatsApp guardada." };
}

export async function testWhatsAppConnection(): Promise<IntegrationsActionState> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { data: config, error } = await supabase
    .from("whatsapp_configs")
    .select("phone_number_id, access_token_encrypted")
    .eq("organization_id", organizationId)
    .single();

  if (error || !config) {
    return { error: "Primero guarda tu configuracion de WhatsApp." };
  }

  try {
    const accessToken = decrypt(config.access_token_encrypted);
    const res = await fetch(`${GRAPH_API_BASE}/${config.phone_number_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      return { error: `Meta respondio ${res.status}: ${body.slice(0, 200)}` };
    }

    const json = (await res.json()) as { display_phone_number?: string };
    return {
      success: `Conexion exitosa${json.display_phone_number ? ` (${json.display_phone_number})` : ""}.`,
    };
  } catch {
    return { error: "No pudimos contactar la Graph API de Meta." };
  }
}

const calendarIdSchema = z.object({ calendarId: z.string().trim().min(1) });

export async function saveGoogleCalendarId(
  _prevState: IntegrationsActionState,
  formData: FormData,
): Promise<IntegrationsActionState> {
  const parsed = calendarIdSchema.safeParse({ calendarId: formData.get("calendarId") });
  if (!parsed.success) {
    return { error: "Selecciona un calendario." };
  }

  const { supabase, organizationId } = await requireCurrentOrg();

  const { error } = await supabase
    .from("google_calendar_configs")
    .update({ calendar_id: parsed.data.calendarId, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId);

  if (error) {
    return { error: "No pudimos guardar el calendario seleccionado." };
  }

  revalidatePath("/integraciones");
  return { success: "Calendario actualizado." };
}

export async function disconnectGoogleCalendar(): Promise<IntegrationsActionState> {
  const { supabase, organizationId } = await requireCurrentOrg();

  const { error } = await supabase
    .from("google_calendar_configs")
    .delete()
    .eq("organization_id", organizationId);

  if (error) {
    return { error: "No pudimos desconectar Google Calendar." };
  }

  revalidatePath("/integraciones");
  return { success: "Google Calendar desconectado." };
}
