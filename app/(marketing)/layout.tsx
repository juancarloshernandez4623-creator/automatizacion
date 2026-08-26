import type { ReactNode } from "react";
import { Fraunces, Public_Sans, Martian_Mono } from "next/font/google";

// Estas 3 familias se cargan SOLO para la landing publica (este layout
// envuelve unicamente app/(marketing)/page.tsx) -- el dashboard interno no
// se ve afectado, sigue con el stack sans del sistema definido en
// globals.css. `variable` expone cada una como custom property, consumida
// por las reglas `.marketing` de globals.css en vez de aplicar la clase de
// next/font directo al <body> (que forzaria una sola familia global).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const martianMono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono-brand",
  weight: ["400", "500", "600"],
  display: "swap",
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`marketing ${fraunces.variable} ${publicSans.variable} ${martianMono.variable}`}>
      {children}
    </div>
  );
}
