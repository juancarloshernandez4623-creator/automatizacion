"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";

// Unico trozo "cliente" de toda la landing: el acordeon necesita estado
// (que pregunta esta abierta) para no depender de JS de terceros ni de
// <details> (que no anima la altura con la misma suavidad). El resto de
// app/(marketing)/page.tsx sigue siendo Server Component / estatico --
// aislar esto aqui evita convertir la pagina entera en "use client".
const FAQ_ITEMS = [
  {
    q: "¿Responden personas o es un bot?",
    a: "Es un agente de IA configurado con la información real de tu negocio — no un chatbot de respuestas genéricas. Y en cualquier momento puedes tomar tú la conversación con un clic desde el panel.",
  },
  {
    q: "¿Cuánto tardan en poner el servicio en marcha?",
    a: "La puesta en marcha (conectar tu WhatsApp Business y tu Google Calendar, y configurar el agente) se hace en la sesión inicial incluida en la instalación. En un día tienes todo probado y activo.",
  },
  {
    q: "¿Qué pasa si preguntan algo que el agente no sabe?",
    a: "Lo dice con naturalidad y te pasa la conversación con el contexto ya resuelto — nunca inventa una respuesta ni un precio.",
  },
  {
    q: "¿Tengo que cambiar mi número de WhatsApp?",
    a: "No. Conectas tu propio WhatsApp Business tal como está; Recepta responde desde tu mismo número, tus clientes no notan ningún cambio.",
  },
  {
    q: "¿Qué pasa fuera de horario y los fines de semana?",
    a: "El agente sigue respondiendo 24/7. Si hace falta que intervengas tú, la conversación queda marcada en el panel para que la retomes en cuanto puedas.",
  },
  {
    q: "¿Cómo agenda las citas en mi calendario?",
    a: "Antes de ofrecer un horario, consulta tu disponibilidad real en Google Calendar — nunca ofrece un hueco que ya esté ocupado.",
  },
  {
    q: "¿Qué pasa si recibo más mensajes de los que esperaba?",
    a: "La suscripción no tiene límite de conversaciones: el agente atiende igual con 10 mensajes al mes que con 1.000.",
  },
  {
    q: "¿Puedo ver lo que habló con mi cliente?",
    a: "Sí — cada conversación queda registrada en tu panel, mensaje por mensaje, en tiempo real.",
  },
] as const;

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-medium text-ink-50">{item.q}</span>
              <Plus
                aria-hidden="true"
                size={20}
                className={`shrink-0 text-ink-300 transition-transform duration-200 motion-reduce:transition-none ${
                  isOpen ? "rotate-45" : ""
                }`}
              />
            </button>
            {/* overflow-hidden + max-height: la respuesta queda fisicamente
                recortada a 0 mientras isOpen es false -- max-h-96 es un
                limite generoso, muy por encima de lo que ocupa cualquier
                respuesta, asi que nunca corta texto cuando esta abierta. */}
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-in-out motion-reduce:transition-none ${
                isOpen ? "max-h-96" : "max-h-0"
              }`}
            >
              <p className="pb-5 text-sm text-ink-300">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
