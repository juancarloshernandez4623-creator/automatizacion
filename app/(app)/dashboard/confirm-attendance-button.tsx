"use client";

import { useTransition } from "react";
import { Check } from "@phosphor-icons/react";
import { markAttendanceConfirmed } from "./actions";

export function ConfirmAttendanceButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => void (await markAttendanceConfirmed(appointmentId)))}
      className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
      title="Marcar que el paciente ha confirmado (p. ej. tras llamarle)"
    >
      <Check size={13} />
      {isPending ? "Guardando…" : "Confirmada"}
    </button>
  );
}
