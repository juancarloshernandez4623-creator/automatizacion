"use server";

import { revalidatePath } from "next/cache";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/auth/invite-code";
import { logger } from "@/lib/logger";

export type CreateInviteState = { error?: string; createdCode?: string };

const MAX_CODE_GENERATION_ATTEMPTS = 3;

/**
 * Da de alta un codigo de invitacion nuevo. Solo el dueño de la plataforma
 * puede llamar a esto (ver lib/auth/platform-admin.ts) -- se comprueba aqui
 * ADEMAS de en el Server Component de la pagina porque una Server Action es
 * un endpoint HTTP propio (POST a la ruta donde se uso), invocable
 * directamente sin pasar por el render de la pagina que la referencia.
 */
export async function createInvite(
  _prevState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  if (!(await isPlatformAdmin())) {
    return { error: "No autorizado." };
  }

  const label = String(formData.get("label") ?? "").trim() || null;
  const expiresInDaysRaw = String(formData.get("expiresInDays") ?? "").trim();
  const expiresInDays = expiresInDaysRaw ? Number(expiresInDaysRaw) : null;

  if (expiresInDaysRaw && (!Number.isFinite(expiresInDays) || expiresInDays! <= 0)) {
    return { error: "Los dias de caducidad deben ser un numero positivo." };
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const admin = createAdminClient();

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = generateInviteCode();
    const { error } = await admin.from("signup_invites").insert({
      code,
      label,
      expires_at: expiresAt,
    });

    if (!error) {
      revalidatePath("/admin/invites");
      return { createdCode: code };
    }

    // 23505 = unique_violation. Con 31^8 combinaciones esto es
    // practicamente imposible, pero reintentar con un codigo nuevo es
    // gratis y mas correcto que fallar por una colision de una entre
    // miles de millones.
    if (error.code !== "23505") {
      logger.error({ event: "create_invite_failed", error: error.message });
      return { error: "No se pudo crear el codigo de invitacion." };
    }
  }

  return { error: "No se pudo generar un codigo unico, intentalo de nuevo." };
}

/**
 * Invalida un codigo sin usar (no borra la fila, para conservar el
 * historial). Revocar un codigo YA usado no tiene efecto sobre la cuenta
 * que ya se creo con el -- solo impide que ese mismo codigo se use de
 * nuevo, cosa que de todas formas `used_at` ya impide.
 */
export async function revokeInvite(inviteId: string): Promise<{ error?: string }> {
  if (!(await isPlatformAdmin())) {
    return { error: "No autorizado." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("signup_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (error) {
    return { error: "No se pudo revocar el codigo." };
  }

  revalidatePath("/admin/invites");
  return {};
}
