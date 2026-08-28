"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupSchema } from "@/lib/validations/auth";
import { logger } from "@/lib/logger";
import type { AuthActionState } from "@/app/(auth)/login/actions";

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  // El servicio es solo de pago: el registro esta cerrado detras de un
  // codigo de invitacion de un solo uso que solo el dueño de la plataforma
  // puede generar (app/admin/invites/). `signup_invites` no tiene ninguna
  // policy de RLS a proposito -- se toca exclusivamente con el service
  // role, nunca con el cliente anon de la sesion (que en este punto ademas
  // ni siquiera existe todavia).
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // UPDATE condicional atomico: "reserva" el codigo marcandolo usado ANTES
  // de crear la cuenta, para que dos personas no puedan gastar el mismo
  // codigo a la vez (condicion de carrera). Si esto no devuelve fila, el
  // codigo no existe, ya se uso, esta revocado o caduco -- en cualquier
  // caso, mismo mensaje generico (no hace falta distinguir el motivo para
  // el usuario).
  const { data: invite, error: claimError } = await admin
    .from("signup_invites")
    .update({ used_at: nowIso })
    .eq("code", parsed.data.code)
    .is("used_at", null)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .select("id")
    .maybeSingle();

  if (claimError) {
    logger.error({ event: "signup_invite_claim_error", error: claimError.message });
    return { error: "No se pudo verificar el código de acceso. Inténtalo de nuevo." };
  }

  if (!invite) {
    return { error: "Código de acceso no válido, ya utilizado o caducado." };
  }

  const supabase = await createClient();

  // `full_name` y `organization_name` viajan como user metadata; el trigger
  // private.handle_new_user() (supabase/migrations/0012_signup_trigger.sql)
  // los lee de NEW.raw_user_meta_data para crear la organizacion + profile
  // automaticamente en la misma transaccion del INSERT en auth.users.
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        organization_name: parsed.data.organizationName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
    },
  });

  if (error) {
    // El registro en si fallo (email ya usado, contraseña rechazada por
    // Supabase, etc) -- devolver el codigo a "sin usar" para que el cliente
    // no lo pierda por un fallo que no tiene nada que ver con el codigo.
    await admin.from("signup_invites").update({ used_at: null }).eq("id", invite.id);
    return { error: error.message };
  }

  // Trazabilidad para el panel de admin (que codigo dio de alta a quien).
  // Best-effort: si esto falla, la cuenta ya se creo correctamente, no se
  // bloquea al usuario por un fallo aqui.
  if (data.user) {
    const { error: linkError } = await admin
      .from("signup_invites")
      .update({ used_by: data.user.id })
      .eq("id", invite.id);
    if (linkError) {
      logger.error({ event: "signup_invite_link_error", error: linkError.message });
    }
  }

  // Si el proyecto de Supabase tiene confirmacion de email activada, no hay
  // sesion todavia (session === null) hasta que el usuario haga click en el
  // correo de confirmacion.
  if (!data.session) {
    return {
      success:
        "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesion.",
    };
  }

  redirect("/dashboard");
}
