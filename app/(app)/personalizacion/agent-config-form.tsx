"use client";

import { useActionState, useState } from "react";
import { CheckCircle, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import {
  COMMON_TIMEZONES,
  WEEKDAYS,
  WEEKDAY_LABELS,
  type AgentConfigFormValues,
  type Service,
  type TimeRange,
  type Weekday,
} from "@/lib/types";
import { saveAgentConfig, type SaveAgentConfigState } from "./actions";
import { SandboxChat } from "./sandbox-chat";

function inputClass() {
  return "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400";
}

function labelClass() {
  return "mb-1 block text-xs font-medium text-neutral-600";
}

export function AgentConfigForm({ initialValues }: { initialValues: AgentConfigFormValues }) {
  const [values, setValues] = useState<AgentConfigFormValues>(initialValues);
  const [state, dispatch, isPending] = useActionState<SaveAgentConfigState, FormData>(
    saveAgentConfig,
    null,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("payload", JSON.stringify(values));
    dispatch(formData);
  }

  function updateService(index: number, patch: Partial<Service>) {
    setValues((prev) => ({
      ...prev,
      services: prev.services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function addService() {
    setValues((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", duration_minutes: 30, description: "" }],
    }));
  }

  function removeService(index: number) {
    setValues((prev) => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
  }

  function updateRange(day: Weekday, index: number, patch: Partial<TimeRange>) {
    setValues((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: prev.businessHours[day].map((r, i) => (i === index ? { ...r, ...patch } : r)),
      },
    }));
  }

  function addRange(day: Weekday) {
    setValues((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: [...prev.businessHours[day], { start: "09:00", end: "18:00" }],
      },
    }));
  }

  function removeRange(day: Weekday, index: number) {
    setValues((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: prev.businessHours[day].filter((_, i) => i !== index),
      },
    }));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-neutral-900">Nombre del negocio</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Es el nombre que ves en la barra lateral y en la pestaña del navegador, y el que usa el agente para presentarse.
          </p>
          <input
            value={values.organizationName}
            onChange={(e) => setValues((prev) => ({ ...prev, organizationName: e.target.value }))}
            className={inputClass()}
            placeholder="Clínica Dental Pérez"
          />
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Personalidad del agente</h2>

          <label className={labelClass()}>Prompt del sistema</label>
          <textarea
            value={values.systemPrompt}
            onChange={(e) => setValues((prev) => ({ ...prev, systemPrompt: e.target.value }))}
            rows={5}
            className={`${inputClass()} mb-4 resize-y`}
          />

          <label className={labelClass()}>Tono</label>
          <input
            value={values.tone}
            onChange={(e) => setValues((prev) => ({ ...prev, tone: e.target.value }))}
            className={`${inputClass()} mb-4`}
            placeholder="profesional y cálido"
          />

          <label className={labelClass()}>Mensaje al transferir a un humano</label>
          <textarea
            value={values.handoffMessage}
            onChange={(e) => setValues((prev) => ({ ...prev, handoffMessage: e.target.value }))}
            rows={2}
            className={`${inputClass()} resize-y`}
          />
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Información del negocio</h2>

          <label className={labelClass()}>Teléfono</label>
          <input
            value={values.businessInfo.phone}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                businessInfo: { ...prev.businessInfo, phone: e.target.value },
              }))
            }
            className={`${inputClass()} mb-4`}
          />

          <label className={labelClass()}>Dirección</label>
          <input
            value={values.businessInfo.address}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                businessInfo: { ...prev.businessInfo, address: e.target.value },
              }))
            }
            className={`${inputClass()} mb-4`}
          />

          <label className={labelClass()}>Descripción</label>
          <textarea
            value={values.businessInfo.description}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                businessInfo: { ...prev.businessInfo, description: e.target.value },
              }))
            }
            rows={2}
            className={`${inputClass()} mb-4 resize-y`}
          />

          <label className={labelClass()}>Preguntas frecuentes / notas libres</label>
          <textarea
            value={values.businessInfo.faq}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                businessInfo: { ...prev.businessInfo, faq: e.target.value },
              }))
            }
            rows={4}
            placeholder={"P: ¿Aceptan seguro?\nR: Sí, la mayoría de los seguros dentales."}
            className={`${inputClass()} resize-y`}
          />
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Servicios</h2>
            <button
              type="button"
              onClick={addService}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
            >
              <Plus size={13} /> Agregar
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {values.services.map((service, index) => (
              <div key={index} className="flex items-start gap-2 rounded-lg border border-neutral-100 p-3">
                <div className="flex-1">
                  <input
                    value={service.name}
                    onChange={(e) => updateService(index, { name: e.target.value })}
                    placeholder="Nombre del servicio"
                    className={`${inputClass()} mb-2`}
                  />
                  <input
                    value={service.description ?? ""}
                    onChange={(e) => updateService(index, { description: e.target.value })}
                    placeholder="Descripción (opcional)"
                    className={inputClass()}
                  />
                </div>
                <div className="w-28">
                  <label className={labelClass()}>Minutos</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={service.duration_minutes}
                    onChange={(e) =>
                      updateService(index, { duration_minutes: Number(e.target.value) || 0 })
                    }
                    className={inputClass()}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Quitar servicio"
                >
                  <Trash size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-neutral-900">Horario de atención</h2>
          <p className="mb-4 text-xs text-neutral-500">
            El agente nunca ofrece citas fuera de estos horarios, y estos horarios se interpretan en
            la zona horaria de abajo. Si no coincide con la de tu negocio, los horarios que ofrezca
            el agente estarán desfasados respecto a tu Google Calendar real.
          </p>

          <label className={labelClass()}>Zona horaria del negocio</label>
          <select
            value={values.timezone}
            onChange={(e) => setValues((prev) => ({ ...prev, timezone: e.target.value }))}
            className={`${inputClass()} mb-5`}
          >
            {!COMMON_TIMEZONES.some((tz) => tz.value === values.timezone) && (
              <option value={values.timezone}>{values.timezone}</option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-3">
            {WEEKDAYS.map((day) => (
              <div key={day} className="flex items-start gap-3">
                <span className="w-20 shrink-0 pt-2 text-xs font-medium text-neutral-600">
                  {WEEKDAY_LABELS[day]}
                </span>
                <div className="flex-1 flex flex-col gap-2">
                  {values.businessHours[day].length === 0 && (
                    <p className="pt-2 text-xs text-neutral-400">Cerrado</p>
                  )}
                  {values.businessHours[day].map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={range.start}
                        onChange={(e) => updateRange(day, index, { start: e.target.value })}
                        className={`${inputClass()} w-32`}
                      />
                      <span className="text-xs text-neutral-400">a</span>
                      <input
                        type="time"
                        value={range.end}
                        onChange={(e) => updateRange(day, index, { end: e.target.value })}
                        className={`${inputClass()} w-32`}
                      />
                      <button
                        type="button"
                        onClick={() => removeRange(day, index)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Quitar horario"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRange(day)}
                    className="flex w-fit items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Plus size={12} /> Agregar horario
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
          {state?.success && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle size={16} weight="fill" /> Guardado
            </span>
          )}
          {state?.error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <WarningCircle size={16} weight="fill" /> {state.error}
            </span>
          )}
        </div>
      </form>

      <div className="h-[calc(100vh-10rem)] lg:sticky lg:top-6">
        <SandboxChat agentConfig={values} />
      </div>
    </div>
  );
}
