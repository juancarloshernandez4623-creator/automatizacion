"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInWithPassword, signInWithMagicLink } from "./actions";
import { AuthField, AuthSubmitButton, AuthMessage } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [passwordState, passwordAction] = useActionState(signInWithPassword, {});
  const [magicLinkState, magicLinkAction] = useActionState(signInWithMagicLink, {});

  const state = mode === "password" ? passwordState : magicLinkState;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4">
      {/* La marca va fuera y encima de la tarjeta, no metida dentro junto al
          titulo -- para que quede claro desde el primer vistazo en que
          aplicacion se esta iniciando sesion, con el peso visual propio de
          una portada de login (no de una etiqueta mas del formulario). */}
      <Logo size="lg" />

      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Inicia sesión</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Administra las conversaciones y citas de tu negocio.
        </p>

        {mode === "password" ? (
          <form action={passwordAction} className="flex flex-col gap-4">
            <AuthField label="Correo" name="email" type="email" autoComplete="email" />
            <AuthField
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
            />
            <AuthMessage error={state.error} success={state.success} />
            <AuthSubmitButton>Iniciar sesión</AuthSubmitButton>
          </form>
        ) : (
          <form action={magicLinkAction} className="flex flex-col gap-4">
            <AuthField label="Correo" name="email" type="email" autoComplete="email" />
            <AuthMessage error={state.error} success={state.success} />
            <AuthSubmitButton>Enviar enlace de acceso</AuthSubmitButton>
          </form>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
          className="mt-4 text-sm text-brand-600 hover:text-brand-700 hover:underline"
        >
          {mode === "password"
            ? "Prefiero recibir un enlace por correo"
            : "Prefiero usar mi contraseña"}
        </button>

        <p className="mt-6 text-sm text-neutral-500">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:underline">
            Crea una gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
