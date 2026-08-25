import { createAdminClient } from "@/lib/supabase/admin";

export type ResolvedWhatsAppOrg = {
  organizationId: string;
  phoneNumberId: string;
  appSecretEncrypted: string;
  accessTokenEncrypted: string;
};

/**
 * Resuelve la organizacion duena de un `phone_number_id` (usado en el POST
 * del webhook, ANTES de verificar la firma -- solo para saber que
 * `app_secret` usar al calcular el HMAC esperado; ver el algoritmo
 * documentado en el plan). Usa el cliente admin porque el webhook no tiene
 * sesion de usuario.
 */
export async function resolveOrgByPhoneNumberId(
  phoneNumberId: string,
): Promise<ResolvedWhatsAppOrg | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("whatsapp_configs")
    .select("organization_id, phone_number_id, app_secret_encrypted, access_token_encrypted")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    organizationId: data.organization_id,
    phoneNumberId: data.phone_number_id,
    appSecretEncrypted: data.app_secret_encrypted,
    accessTokenEncrypted: data.access_token_encrypted,
  };
}

/**
 * Resuelve la organizacion por `verify_token` (usado SOLO en el handshake
 * GET de verificacion del webhook, que corre una vez por alta en Meta, no
 * por mensaje).
 */
export async function resolveOrgByVerifyToken(verifyToken: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("whatsapp_configs")
    .select("organization_id")
    .eq("verify_token", verifyToken)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.organization_id;
}
