import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
      <Compass size={40} weight="duotone" className="text-brand-500" />
      <h1 className="text-xl font-semibold text-neutral-900">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
