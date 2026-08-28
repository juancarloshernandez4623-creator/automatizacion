"use server";

import { revalidatePath } from "next/cache";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/auth/invite-code";
import { deriveLoginEmail } from "@/lib/auth/access-code-email";
import { logger } from "@/lib/logger";

export type CreateInviteState = { error?: string; createdCode?: string };

const MAX_CODE_GENERATION_ATTEMPTS = 3;
// "100 años" en horas -- convencion documentada por Supabase para un ban
// efectivamente permanente (no existe un valor literal "forever").
const PERMANENT_BAN_DURATION = "876000h";

/**
 * Da de alta un cliente nuevo: crea su cuenta de Supabase Auth (con la
 * clave de acceso como contraseña) Y su organizacion/profile en el mismo
 * paso -- no hay ya una pantalla de /signup donde el cliente rellene esto
 * el mismo. Eso le permite al dueño de la plataforma entrar primero (con
 * este mismo codigo) y dejar todo configurado (WhatsApp, Google Calendar,
 * personalizacion del agente) antes de pasarle el codigo al cliente.
 *
 * Solo el dueño de la plataforma puede llamar a esto (ver
 * lib/auth/platform-admin.ts) -- se comprueba aqui ADEMAS de en el Server
 * Component de la pagina porque una Server Action es un endpoint HTTP
 * propio, invocable directamente sin pasar por el render de la pagina que
 * la referencia.
 */
export async function createInvite(
  _prevState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  if (!(await isPlatformAdmin())) {
    return { error: "No autorizado." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  const expiresInDaysRaw = String(formData.get("expiresInDays") ?? "").trim();
  const expiresInDays = expiresInDaysRaw ? Number(expiresInDaysRaw) : null;

  if (!fullName) {
    return { error: "El nombre del cliente es obligatorio." };
  }
  if (!organizationName) {
    return { error: "El nombre del negocio es obligatorio." };
  }
  if (expiresInDaysRaw && (!Number.isFinite(expiresInDays) || expiresInDays! <= 0)) {
    return { error: "Los dias de caducidad deben ser un numero positivo." };
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const admin = createAdminClient();

  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const code = generateInviteCode();
    const loginEmail = deriveLoginEmail(code);

    // Crear el auth user PRIMERO: su unicidad en `email` (derivado 1:1 del
    // codigo) es lo que detecta una colision de codigo, sin necesitar
    // reservar la fila de access_codes por separado. El trigger
    // private.handle_new_user() (migrations/0012) crea organizations +
    // profiles automaticamente a partir de este mismo INSERT en
    // auth.users, exactamente igual que en el /signup que este flujo
    // reemplaza.
    const { data: created, error: createUserError } = await admin.auth.admin.createUser({
      email: loginEmail,
      password: code,
      email_confirm: true,
      user_metadata: { full_name: fullName, organization_name: organizationName },
    });

    if (createUserError || !created.user) {
      // 3 intentos con codigos nuevos son gratis y, con 31^8 combinaciones,
      // mas que suficiente ante una colision astronomicamente improbable.
      // Cualquier otro fallo (no relacionado con la colision) se reporta
      // directamente en vez de reintentar a ciegas.
      const message = createUserError?.message ?? "";
      const looksLikeCollision = /already registered|already exists/i.test(message);
      if (looksLikeCollision && attempt < MAX_CODE_GENERATION_ATTEMPTS - 1) {
        continue;
      }
      logger.error({ event: "create_invite_auth_user_failed", error: message });
      return { error: "No se pudo crear la cuenta del cliente." };
    }

    const { error: insertError } = await admin.from("access_codes").insert({
      code,
      label,
      expires_at: expiresAt,
      login_email: loginEmail,
      user_id: created.user.id,
    });

    if (insertError) {
      // La cuenta ya se creo pero no se pudo dejar registrado el codigo --
      // deshacer la creacion del usuario para no dejar una cuenta huerfana
      // sin ningun codigo que la desbloquee.
      await admin.auth.admin.deleteUser(created.user.id);
      logger.error({ event: "create_invite_row_failed", error: insertError.message });
      return { error: "No se pudo guardar el código de invitación." };
    }

    revalidatePath("/admin/invites");
    return { createdCode: code };
  }

  return { error: "No se pudo generar un codigo unico, intentalo de nuevo." };
}

/**
 * Revoca un codigo Y banea la cuenta de Supabase Auth asociada -- a
 * diferencia del modelo anterior (codigo de un solo uso sin usar todavia),
 * ahora el codigo ES la contraseña de una cuenta ya creada y en uso, asi
 * que "revocar" tiene que cortar el acceso de verdad, no solo impedir un
 * registro futuro que ya no existe como concepto.
 */
export async function revokeInvite(inviteId: string): Promise<{ error?: string }> {
  if (!(await isPlatformAdmin())) {
    return { error: "No autorizado." };
  }

  const admin = createAdminClient();
  const { data: invite, error: fetchError } = await admin
    .from("access_codes")
    .select("user_id")
    .eq("id", inviteId)
    .single();

  if (fetchError || !invite) {
    return { error: "No se encontró el código." };
  }

  if (invite.user_id) {
    const { error: banError } = await admin.auth.admin.updateUserById(invite.user_id, {
      ban_duration: PERMANENT_BAN_DURATION,
    });
    if (banError) {
      logger.error({ event: "revoke_invite_ban_failed", error: banError.message });
      return { error: "No se pudo bloquear la cuenta asociada." };
    }
  }

  const { error } = await admin
    .from("access_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (error) {
    return { error: "No se pudo revocar el codigo." };
  }

  revalidatePath("/admin/invites");
  return {};
}
