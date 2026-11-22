"use client";

import { useActionState } from "react";
import { saveReminderSettings, type IntegrationsActionState } from "./actions";

type ReminderSettings = {
  reminders_enabled: boolean;
  reminder_template_name: string | null;
  reminder_template_language: string;
} | null;

/** Texto sugerido para crear la plantilla en Meta (categoria Utilidad, 4 variables en este orden). */
const SUGGESTED_TEMPLATE =
  "Hola {{1}}, le recordamos su cita en {{2}} el {{3}} a las {{4}}. ¿Nos confirma su asistencia? Si no puede venir, respóndanos y se la cambiamos.";

export function RemindersForm({
  settings,
  whatsappConnected,
}: {
  settings: ReminderSettings;
  whatsappConnected: boolean;
}) {
  const [state, formAction, isPending] = useActionState<IntegrationsActionState, FormData>(
    saveReminderSettings,
    {},
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        <p className="mb-2 font-medium text-neutral-800">Antes de activarlos: crea la plantilla en Meta</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            En <strong>WhatsApp Manager → Plantillas de mensajes</strong>, crea una plantilla de
            categoría <strong>Utilidad</strong>, idioma <strong>Español</strong>.
          </li>
          <li>
            Cuerpo (respeta el orden de las variables):
            <span className="mt-1 block rounded-md bg-white p-2 font-mono text-xs text-neutral-800">
              {SUGGESTED_TEMPLATE}
            </span>
          </li>
          <li>
            Añade dos botones de <strong>respuesta rápida</strong>: «Confirmo asistencia» y «Necesito
            cambiarla».
          </li>
          <li>Cuando Meta la apruebe, escribe aquí su nombre exacto y activa los recordatorios.</li>
        </ol>
      </div>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-800 sm:col-span-2">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={settings?.reminders_enabled ?? false}
            disabled={!whatsappConnected}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Enviar recordatorio por WhatsApp el día anterior a cada cita
        </label>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="templateName" className="text-sm font-medium text-neutral-700">
            Nombre de la plantilla en Meta
          </label>
          <input
            id="templateName"
            name="templateName"
            defaultValue={settings?.reminder_template_name ?? ""}
            placeholder="recordatorio_cita"
            disabled={!whatsappConnected}
            className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 font-mono text-sm text-neutral-900 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="templateLanguage" className="text-sm font-medium text-neutral-700">
            Idioma de la plantilla
          </label>
          <input
            id="templateLanguage"
            name="templateLanguage"
            defaultValue={settings?.reminder_template_language ?? "es"}
            placeholder="es"
            disabled={!whatsappConnected}
            className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 font-mono text-sm text-neutral-900 outline-none focus:border-brand-500"
          />
          <p className="text-xs text-neutral-500">El código exacto con el que la aprobó Meta (es, es_ES…).</p>
        </div>

        {!whatsappConnected && (
          <p className="text-sm text-neutral-500 sm:col-span-2">
            Conecta primero tu WhatsApp Business (arriba).
          </p>
        )}
        {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
        {state.success && <p className="text-sm text-brand-700 sm:col-span-2">{state.success}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!whatsappConnected || isPending}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar recordatorios
          </button>
        </div>
      </form>
    </div>
  );
}
