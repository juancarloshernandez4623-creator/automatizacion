"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Trash } from "@phosphor-icons/react";
import { createInvite, revokeInvite, type CreateInviteState } from "./actions";

export type InviteListItem = {
  id: string;
  code: string;
  label: string | null;
  created_at: string;
  expires_at: string | null;
  user_id: string | null;
  revoked_at: string | null;
};

function inviteStatus(invite: InviteListItem): {
  label: string;
  className: string;
} {
  if (invite.revoked_at) {
    return { label: "Revocado", className: "bg-neutral-100 text-neutral-500" };
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { label: "Caducado", className: "bg-amber-50 text-amber-700" };
  }
  return { label: "Activo", className: "bg-green-50 text-green-700" };
}

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creando cuenta…" : "Dar de alta"}
    </button>
  );
}

// Ya no hay un enlace a /signup que copiar (no existe): esto copia el
// codigo tal cual, listo para pegarlo en un mensaje de WhatsApp/email al
// cliente junto con la URL de /login.
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
    >
      {copied ? (
        <Check size={13} weight="bold" className="text-brand-600" />
      ) : (
        <Copy size={13} weight="bold" />
      )}
      {copied ? "Copiado" : "Copiar código"}
    </button>
  );
}

export function InviteManager({ initialInvites }: { initialInvites: InviteListItem[] }) {
  const [state, formAction] = useActionState<CreateInviteState, FormData>(createInvite, {});
  const [isRevokePending, startRevokeTransition] = useTransition();

  function handleRevoke(id: string) {
    if (
      !window.confirm(
        "¿Revocar este código? Se bloqueará también la cuenta del cliente: dejará de poder iniciar sesión.",
      )
    ) {
      return;
    }
    startRevokeTransition(async () => {
      await revokeInvite(id);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="fullName" className="text-xs font-medium text-neutral-600">
              Nombre del cliente
            </label>
            <input
              id="fullName"
              name="fullName"
              placeholder="Ej. Ana Martínez"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="organizationName" className="text-xs font-medium text-neutral-600">
              Nombre del negocio
            </label>
            <input
              id="organizationName"
              name="organizationName"
              placeholder="Ej. Clínica Dental Sonrisas"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="label" className="text-xs font-medium text-neutral-600">
              Nota interna (opcional)
            </label>
            <input
              id="label"
              name="label"
              placeholder="Solo la ves tú en esta lista"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex w-40 flex-col gap-1.5">
            <label htmlFor="expiresInDays" className="text-xs font-medium text-neutral-600">
              Caduca en (días, opcional)
            </label>
            <input
              id="expiresInDays"
              name="expiresInDays"
              type="number"
              min="1"
              placeholder="Nunca"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        {state.createdCode && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-brand-800">
                Cuenta creada — código: <span className="font-mono">{state.createdCode}</span>
              </p>
              <p className="text-xs text-brand-700">
                Guárdalo ahora: es la contraseña permanente de esta cuenta y no se vuelve a
                mostrar entero después.
              </p>
            </div>
            <CopyCodeButton code={state.createdCode} />
          </div>
        )}

        <div>
          <CreateSubmitButton />
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs font-medium uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2.5">Código</th>
              <th className="px-4 py-2.5">Nota</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5">Creado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {initialInvites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no has dado de alta ningún cliente.
                </td>
              </tr>
            )}
            {initialInvites.map((invite) => {
              const status = inviteStatus(invite);
              const canRevoke = !invite.revoked_at;
              return (
                <tr key={invite.id}>
                  <td className="px-4 py-2.5 font-mono text-neutral-900">{invite.code}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{invite.label || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {new Date(invite.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <CopyCodeButton code={invite.code} />
                      {canRevoke && (
                        <button
                          type="button"
                          disabled={isRevokePending}
                          onClick={() => handleRevoke(invite.id)}
                          aria-label="Revocar código"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
