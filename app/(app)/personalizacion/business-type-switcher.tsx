"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_TYPE_LABELS, type BusinessType } from "@/lib/types";
import { changeBusinessType } from "./actions";

/**
 * Tipo de negocio de la cuenta. Cambiarlo cambia las reglas del agente; la
 * casilla permite además sustituir los servicios por el catálogo típico del
 * sector (útil al corregir una cuenta creada con el tipo equivocado).
 */
export function BusinessTypeSwitcher({ current }: { current: BusinessType }) {
  const router = useRouter();
  const [type, setType] = useState<BusinessType>(current);
  const [loadDefaults, setLoadDefaults] = useState(true);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const changed = type !== current;

  function apply(withDefaults: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await changeBusinessType(type, withDefaults);
      if (result.error) {
        setMessage({ text: result.error, error: true });
        return;
      }
      setMessage({
        text: withDefaults
          ? `Listo: ahora es «${BUSINESS_TYPE_LABELS[type]}» con sus servicios típicos cargados.`
          : `Listo: ahora es «${BUSINESS_TYPE_LABELS[type]}».`,
        error: false,
      });
      router.refresh();
    });
  }

  return (
    <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-neutral-900">Tipo de negocio</h2>
      <p className="mb-4 text-xs text-neutral-500">
        Define cómo atiende el agente: qué tratamientos reserva directamente y cuáles pasan antes por valoración.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((t) => (
          <label
            key={t}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
          >
            <input
              type="radio"
              name="business-type-switch"
              id={`business-type-switch-${t}`}
              checked={type === t}
              onChange={() => setType(t)}
            />
            {BUSINESS_TYPE_LABELS[t]}
          </label>
        ))}
      </div>

      {changed && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-neutral-50 p-3">
          <label className="flex items-start gap-2 text-sm text-neutral-700" htmlFor="load-defaults">
            <input
              id="load-defaults"
              type="checkbox"
              className="mt-0.5"
              checked={loadDefaults}
              onChange={(e) => setLoadDefaults(e.target.checked)}
            />
            <span>
              Sustituir los servicios actuales por los típicos de «{BUSINESS_TYPE_LABELS[type]}»
              <span className="block text-xs text-neutral-500">
                Después podrás quitar, añadir o cambiar los que quieras. Si no la marcas, se mantienen tus servicios.
              </span>
            </span>
          </label>
          <div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => apply(loadDefaults)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isPending ? "Cambiando…" : "Cambiar tipo de negocio"}
            </button>
          </div>
        </div>
      )}

      {!changed && !confirmReset && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Restablecer los servicios típicos de «{BUSINESS_TYPE_LABELS[current]}»
          </button>
        </div>
      )}

      {!changed && confirmReset && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <span>Se sustituirán todos tus servicios actuales por la lista por defecto. ¿Continuar?</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => { apply(true); setConfirmReset(false); }}
            className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? "Cargando…" : "Sí, restablecer"}
          </button>
          <button type="button" onClick={() => setConfirmReset(false)} className="rounded-md px-3 py-1 text-xs font-medium hover:bg-amber-100">
            Cancelar
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.error ? "text-red-600" : "text-brand-700"}`}>{message.text}</p>
      )}
    </section>
  );
}
