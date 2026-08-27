"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { CheckCircle, Phone, Trash, User, WarningCircle, X, XCircle } from "@phosphor-icons/react";
import { deleteAppointment, updateAppointmentStatus } from "./actions";

export type AppointmentRow = {
  id: string;
  service: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled" | "completed";
  full_name: string;
  phone: string;
  is_new_patient: boolean | null;
  notes: string | null;
};

const statusLabel: Record<AppointmentRow["status"], { label: string; className: string }> = {
  confirmed: { label: "Confirmada", className: "bg-brand-100 text-brand-700" },
  completed: { label: "Completada", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", className: "bg-neutral-100 text-neutral-500" },
};

export function AppointmentModal({
  date,
  appointments,
  organizationTimezone,
  onClose,
}: {
  date: string;
  appointments: AppointmentRow[];
  organizationTimezone: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState(appointments);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleStatusChange(id: string, status: "completed" | "cancelled") {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, status);
      if (result?.error) {
        setError(result.error);
      } else {
        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      }
      setPendingId(null);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteAppointment(id);
      if (result?.error) {
        setError(result.error);
        setPendingId(null);
      } else {
        setItems((prev) => {
          const next = prev.filter((a) => a.id !== id);
          if (next.length === 0) onClose();
          return next;
        });
        setConfirmingDeleteId(null);
        setPendingId(null);
      }
    });
  }

  const dateLabel = format(new Date(`${date}T00:00:00Z`), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl thin-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <h3 className="text-sm font-semibold capitalize text-neutral-900">{dateLabel}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <p className="mx-5 mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            <WarningCircle size={13} weight="fill" />
            {error}
          </p>
        )}

        <div className="flex flex-col divide-y divide-neutral-100 px-5 py-2">
          {items.map((appt) => {
            const badge = statusLabel[appt.status];
            const isPending = pendingId === appt.id;
            return (
              <div key={appt.id} className="flex flex-col gap-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{appt.service}</p>
                    <p className="text-xs text-neutral-500">
                      {formatInTimeZone(appt.starts_at, organizationTimezone, "HH:mm")} –{" "}
                      {formatInTimeZone(appt.ends_at, organizationTimezone, "HH:mm")}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-neutral-600">
                  <span className="flex items-center gap-1.5">
                    <User size={13} /> {appt.full_name}
                    {appt.is_new_patient && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Nuevo
                      </span>
                    )}
                  </span>
                  {appt.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} /> {appt.phone}
                    </span>
                  )}
                  {appt.notes && <p className="mt-1 text-neutral-500">{appt.notes}</p>}
                </div>

                {confirmingDeleteId === appt.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-neutral-600">¿Eliminar esta cita para siempre?</span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(appt.id)}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmingDeleteId(null)}
                      className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {appt.status === "confirmed" && (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStatusChange(appt.id, "completed")}
                          className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                        >
                          <CheckCircle size={14} weight="fill" />
                          Completar
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStatusChange(appt.id, "cancelled")}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle size={14} weight="fill" />
                          Cancelar
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmingDeleteId(appt.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash size={14} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
