"use client";

import { GoogleLogo, LinkBreak } from "@phosphor-icons/react";
import { useTransition } from "react";
import { disconnectGoogleCalendar } from "./actions";

export function GoogleConnectButton({ connected }: { connected: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (connected) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            // `startTransition` exige que el callback devuelva void/undefined
            // (o una promesa de eso) -- `disconnectGoogleCalendar()` devuelve
            // el estado de la action, que aqui no nos interesa leer.
            void disconnectGoogleCalendar();
          })
        }
        className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        <LinkBreak size={16} />
        Desconectar Google Calendar
      </button>
    );
  }

  return (
    <a
      href="/api/auth/google/connect"
      className="flex w-fit items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
    >
      <GoogleLogo size={16} weight="bold" />
      Conectar con Google
    </a>
  );
}
