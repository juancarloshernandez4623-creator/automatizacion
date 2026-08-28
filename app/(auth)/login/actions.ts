"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, magicLinkSchema, accessCodeSchema } from "@/lib/validations/auth";
import { normalizeAccessCode } from "@/lib/auth/access-code-email";

export type AuthActionState = {
  error?: string;
  success?: string;
};

/**
 * Login del cliente: el modo por defecto y el unico que se ofrece fuera del
 * enlace de administrador (ver login/page.tsx). El codigo es la contraseña
 * real de una cuenta ya creada desde /admin/invites -- aqui solo hace falta
 * resolver que `login_email` sintetico le corresponde (con el service role,
 * ya que access_codes no tiene ninguna policy de RLS) y dejar que
 * `signInWithPassword` verifique la contraseña como con cualquier otra
 * cuenta.
 */
export async function signInWithCode(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = accessCodeSchema.safeParse({ code: formData.get("code") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Código inválido" };
  }

  const code = normalizeAccessCode(parsed.data.code);
  const admin = createAdminClient();
  const { data: accessCode } = await admin
    .from("access_codes")
    .select("login_email, revoked_at")
    .eq("code", code)
    .maybeSingle();

  if (!accessCode || accessCode.revoked_at || !accessCode.login_email) {
    return { error: "Código de acceso no válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: accessCode.login_email,
    password: code,
  });

  if (error) {
    return { error: "Código de acceso no válido." };
  }

  redirect("/dashboard");
}

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/dashboard");
}

export async function signInWithMagicLink(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Correo invalido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback`,
    },
  });

  if (error) {
    return { error: "No pudimos enviar el enlace. Intenta de nuevo." };
  }

  return { success: "Te enviamos un enlace de acceso a tu correo." };
}
