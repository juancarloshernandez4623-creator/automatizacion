"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { AuthField, AuthSubmitButton, AuthMessage } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, {});

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4 py-12">
      <Logo size="lg" />

      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Crea tu cuenta</h1>
        <p className="mb-6 text-sm text-neutral-500">
          En un minuto tienes tu propio espacio para conectar WhatsApp.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
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
      </div>
    </main>
  );
}
