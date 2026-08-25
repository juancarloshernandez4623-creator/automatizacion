"use client";

import { useActionState, useState, useTransition } from "react";
import { Copy, Check, Plugs, PlugsConnected } from "@phosphor-icons/react";
import { AuthField } from "@/components/auth/auth-form";
import {
  saveWhatsAppConfig,
  testWhatsAppConnection,
  type IntegrationsActionState,
} from "./actions";

type ExistingConfig = {
  phone_number_id: string;
  waba_id: string;
  verify_token: string;
} | null;

function CopyableRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <p className="truncate font-mono text-sm text-neutral-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check size={16} className="text-brand-600" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export function WhatsAppForm({ existingConfig }: { existingConfig: ExistingConfig }) {
  const [state, formAction] = useActionState<IntegrationsActionState, FormData>(
    saveWhatsAppConfig,
    {},
  );
  const [testResult, setTestResult] = useState<IntegrationsActionState>({});
  const [isTesting, startTest] = useTransition();

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/webhooks/whatsapp`;

  function handleTestConnection() {
    startTest(async () => {
      const result = await testWhatsAppConnection();
      setTestResult(result);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <CopyableRow label="URL del webhook (Callback URL en Meta)" value={webhookUrl} />
        <CopyableRow
          label="Verify token actual"
          value={existingConfig?.verify_token ?? "(guarda la config primero)"}
        />
      </div>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="Phone Number ID"
          name="phoneNumberId"
          defaultValue={existingConfig?.phone_number_id}
        />
        <AuthField label="WABA ID" name="wabaId" defaultValue={existingConfig?.waba_id} />
        <AuthField
          label="Access Token (System User)"
          name="accessToken"
          type="password"
          placeholder={
            existingConfig
              ? "Ya guardado — por seguridad no se muestra, reingresa para actualizar"
              : undefined
          }
        />
        <AuthField
          label="Verify Token"
          name="verifyToken"
          defaultValue={existingConfig?.verify_token}
        />
        <div className="sm:col-span-2">
          <AuthField
            label="App Secret"
            name="appSecret"
            type="password"
            placeholder={
              existingConfig
                ? "Ya guardado — por seguridad no se muestra, reingresa para actualizar"
                : undefined
            }
          />
        </div>

        {state.error && <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>}
        {state.success && (
          <p className="sm:col-span-2 text-sm text-brand-700">{state.success}</p>
        )}

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Guardar configuración
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !existingConfig}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTesting ? <Plugs className="animate-pulse" size={16} /> : <PlugsConnected size={16} />}
            Probar conexión
          </button>
        </div>
      </form>

      {testResult.error && <p className="text-sm text-red-600">{testResult.error}</p>}
      {testResult.success && <p className="text-sm text-brand-700">{testResult.success}</p>}
    </div>
  );
}
