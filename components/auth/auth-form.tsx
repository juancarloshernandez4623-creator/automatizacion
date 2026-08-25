"use client";

import { useFormStatus } from "react-dom";
import { CircleNotch } from "@phosphor-icons/react";

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

export function AuthSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <CircleNotch className="animate-spin" size={16} weight="bold" />}
      {children}
    </button>
  );
}

export function AuthMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;

  return (
    <p
      className={
        error
          ? "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          : "rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700"
      }
      role="status"
    >
      {error ?? success}
    </p>
  );
}
