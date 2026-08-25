"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  CalendarCheck,
  ChatCircleDots,
  Sliders,
  Plugs,
  SignOut,
} from "@phosphor-icons/react";
import { signOut } from "@/app/(app)/actions";
import { Logo } from "@/components/brand/logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/citas", label: "Citas", icon: CalendarCheck },
  { href: "/conversaciones", label: "Conversaciones", icon: ChatCircleDots },
  { href: "/personalizacion", label: "Personalización", icon: Sliders },
  { href: "/integraciones", label: "Integraciones", icon: Plugs },
] as const;

export function Sidebar({
  organizationName,
  userLabel,
}: {
  organizationName: string;
  userLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
      {/* Marca de la plataforma (Recepta): con mas peso visual que antes a
          proposito (simbolo dorado + wordmark, no un monograma diminuto),
          pero en su propio bloque separado por el borde de abajo -- el
          negocio del cliente (bloque siguiente) sigue siendo el elemento
          principal del panel, esta es la firma del producto. */}
      <div className="border-b border-neutral-100 px-5 py-5">
        <Logo size="md" />
      </div>

      <div className="flex items-center gap-2 border-y border-neutral-200 px-5 py-4">
        <ChatCircleDots className="text-brand-600" size={24} weight="fill" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {organizationName}
          </p>
          <p className="truncate text-xs text-neutral-400">{userLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="border-t border-neutral-200 px-3 py-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <SignOut size={18} />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
