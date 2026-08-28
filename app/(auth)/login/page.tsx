"use client";

import { useActionState, useState } from "react";
import { signInWithCode, signInWithPassword, signInWithMagicLink } from "./actions";
import { AuthField, AuthSubmitButton, AuthMessage } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";

// "code" es el unico modo visible para un cliente: no hay registro en
// ningun sitio, solo la clave de acceso permanente que le entrega el dueño
// de la plataforma (ver app/admin/invites/). "password"/"magic-link" son el
// acceso del propio dueño a su cuenta de administrador -- se revelan con un
// enlace discreto, nunca por defecto.
type Mode = "code" | "password" | "magic-link";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("code");
  const [codeState, codeAction] = useActionState(signInWithCode, {});
  const [passwordState, passwordAction] = useActionState(signInWithPassword, {});
  const [magicLinkState, magicLinkAction] = useActionState(signInWithMagicLink, {});

  const state = mode === "code" ? codeState : mode === "password" ? passwordState : magicLinkState;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-4">
      <Logo size="lg" />

      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-neutral-900">Inicia sesión</h1>
        <p className="mb-6 text-sm text-neutral-500">
          {mode === "code"
            ? "Introduce el código de acceso que te hemos proporcionado."
            : "Administra las conversaciones y citas de tu negocio."}
        </p>

        {mode === "code" && (
          <form action={codeAction} className="flex flex-col gap-4">
            <AuthField
              label="Código de acceso"
              name="code"
              placeholder="XXXX-XXXX"
              autoComplete="off"
            />
            <AuthMessage error={state.error} success={state.success} />
            <AuthSubmitButton>Entrar</AuthSubmitButton>
          </form>
        )}

        {mode === "password" && (
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
        )}

        {mode === "magic-link" && (
          <form action={magicLinkAction} className="flex flex-col gap-4">
            <AuthField label="Correo" name="email" type="email" autoComplete="email" />
            <AuthMessage error={state.error} success={state.success} />
            <AuthSubmitButton>Enviar enlace de acceso</AuthSubmitButton>
          </form>
        )}

        {mode === "code" ? (
          <button
            type="button"
            onClick={() => setMode("password")}
            className="mt-4 text-sm text-neutral-400 hover:text-neutral-600 hover:underline"
          >
            ¿Eres el administrador? Inicia sesión con tu correo
          </button>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
              className="text-sm text-brand-600 hover:text-brand-700 hover:underline"
            >
              {mode === "password"
                ? "Prefiero recibir un enlace por correo"
                : "Prefiero usar mi contraseña"}
            </button>
            <button
              type="button"
              onClick={() => setMode("code")}
              className="text-left text-sm text-neutral-400 hover:text-neutral-600 hover:underline"
            >
              Volver al acceso con código
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
