"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { importFromGoogleCalendar } from "./actions";

export function ImportCalendarButton({ monthDate }: { monthDate: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await importFromGoogleCalendar(monthDate);
      if (result.error) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      const count = result.imported ?? 0;
      setMessage({
        text: count > 0 ? `Se importaron ${count} evento${count === 1 ? "" : "s"}.` : "No hay eventos nuevos en Calendar para este mes.",
        isError: false,
      });
      if (count > 0) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
      >
        <ArrowsClockwise size={16} className={isPending ? "animate-spin" : undefined} />
        {isPending ? "Importando…" : "Importar de Calendar"}
      </button>
      {message && (
        <p className={`text-xs ${message.isError ? "text-red-600" : "text-neutral-500"}`}>{message.text}</p>
      )}
    </div>
  );
}
