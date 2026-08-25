"use client";

import { useEffect } from "react";
import { WarningOctagon } from "@phosphor-icons/react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({
      event: "unhandled_client_error",
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <WarningOctagon size={40} weight="duotone" className="text-red-500" />
      <h1 className="text-xl font-semibold text-neutral-900">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver más tarde.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
