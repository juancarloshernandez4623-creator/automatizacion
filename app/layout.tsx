import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recepta — Atención al cliente por WhatsApp con IA",
    template: "%s · Recepta",
  },
  description:
    "Recepta: recepcionista de WhatsApp con IA para negocios que agendan citas. Responde, agenda y hace seguimiento por ti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
