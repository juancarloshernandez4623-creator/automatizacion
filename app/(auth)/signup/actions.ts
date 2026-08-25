"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validations/auth";
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" };
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
    return { error: error.message };
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
