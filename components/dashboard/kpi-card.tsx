import type { Icon } from "@phosphor-icons/react";

// Misma estructura que las tarjetas de lista del dashboard (header con
// borde inferior + icono a la derecha, cuerpo debajo) y misma altura fija
// (`h-40`, recortada -- estas tarjetas son mas anchas que altas) que la
// tarjeta de "Citas de hoy", para que las tres de la fila de resumen queden
// visualmente idénticas en tamaño. El valor va centrado (horizontal y
// vertical) en el cuerpo, no pegado a la izquierda.
export function KpiCard({
  label,
  value,
  hint,
  icon: IconComponent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: Icon;
}) {
  return (
    <div className="flex h-40 flex-col rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <IconComponent size={16} weight="duotone" />
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-3xl font-semibold text-neutral-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
      </div>
    </div>
  );
}
