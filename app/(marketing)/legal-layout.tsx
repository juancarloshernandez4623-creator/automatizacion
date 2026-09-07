import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { Logo, LogoMark } from "@/components/brand/logo";

// Layout compartido por las paginas legales (/privacidad, /terminos) --
// header + footer minimos, mismo tema visual que la landing pero sin
// repetir toda su nav (estas paginas no necesitan anclas a #precios etc.,
// solo un enlace de vuelta al inicio). El contenido en si (children) lo
// escribe cada pagina como prosa normal, con las clases .legal-content de
// globals.css controlando la tipografia de parrafos/listas/headings.
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-noir-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" aria-label="Recepta — inicio">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-ink-300 hover:text-ink-50"
          >
            <ArrowLeft size={16} weight="bold" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-medium text-balance text-ink-50 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-ink-500">Última actualización: {updated}</p>

        <div className="legal-content mt-10">{children}</div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <p className="text-sm text-ink-300">Recepta Technologies</p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            <a
              href="mailto:info@usarecepta.com"
              className="flex items-center gap-2 text-ink-300 hover:text-brand-400 sm:justify-end"
            >
              <EnvelopeSimple size={16} weight="fill" />
              info@usarecepta.com
            </a>
            <a
              href="tel:+34625529758"
              className="flex items-center gap-2 text-ink-300 hover:text-brand-400 sm:justify-end"
            >
              <Phone size={16} weight="fill" />
              +34 625 52 97 58
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
