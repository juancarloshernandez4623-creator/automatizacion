"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, WarningCircle, X } from "@phosphor-icons/react";
import { createManualAppointment } from "./actions";

const inputClass =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";
const labelClass = "mb-1 block text-xs font-medium text-neutral-600";

export function NewAppointmentModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [notes, setNotes] = useState("");

  function resetForm() {
    setFullName("");
    setPhone("");
    setService("");
    setDate("");
    setTime("");
    setDurationMinutes(30);
    setIsNewPatient(false);
    setNotes("");
    setError(null);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createManualAppointment({
        fullName,
        phone,
        service,
        date,
        time,
        durationMinutes,
        isNewPatient,
        notes,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        <Plus size={16} weight="bold" />
        Nueva cita
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={handleClose}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl thin-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-900">Nueva cita manual</h3>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
              {error && (
                <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  <WarningCircle size={13} weight="fill" />
                  {error}
                </p>
              )}

              <div>
                <label className={labelClass}>Nombre completo</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="María González"
                />
              </div>

              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className={labelClass}>Servicio</label>
                <input
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className={inputClass}
                  placeholder="Limpieza dental"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Fecha</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Hora</label>
                  <input
                    required
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Duración (minutos)</label>
                <input
                  required
                  type="number"
                  min={5}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={isNewPatient}
                  onChange={(e) => setIsNewPatient(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                />
                Paciente nuevo
              </label>

              <div>
                <label className={labelClass}>Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {isPending ? "Creando…" : "Crear cita"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
