"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { AuthField, AuthSubmitButton, AuthMessage } from "@/components/auth/auth-form";

export function SignupForm({ defaultCode }: { defaultCode?: string }) {
  const [state, formAction] = useActionState(signUp, {});

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <AuthField
          label="Código de acceso"
          name="code"
          placeholder="XXXX-XXXX"
          defaultValue={defaultCode}
          autoComplete="off"
        />
        <AuthField label="Tu nombre" name="fullName" autoComplete="name" />
        <AuthField
          label="Nombre de tu negocio"
          name="organizationName"
          placeholder="Ej. Clínica Dental Sonrisas"
        />
        <AuthField label="Correo" name="email" type="email" autoComplete="email" />
        <AuthField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <AuthMessage error={state.error} success={state.success} />
        <AuthSubmitButton>Crear cuenta</AuthSubmitButton>
      </form>

      <p className="mt-6 text-sm text-neutral-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
