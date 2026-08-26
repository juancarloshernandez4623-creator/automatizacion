import Link from "next/link";
import {
  ChatCircleDots,
  CalendarCheck,
  Robot,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <ChatCircleDots className="text-brand-600" size={26} weight="fill" />
          <span className="text-base font-semibold text-neutral-900">WhatsApp Clínica</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
          >
            Empieza gratis
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          Un asistente de IA que agenda citas por WhatsApp, por ti.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-600">
          Conecta tu WhatsApp Business y tu Google Calendar. Tus clientes escriben,
          el agente responde y agenda; tú te enfocas en atenderlos en persona.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Crear mi cuenta <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          {
            icon: Robot,
            title: "Agente con tu propia voz",
            body: "Escribe el prompt, el tono y la info de tu negocio; el agente responde como tú quieres.",
          },
          {
            icon: CalendarCheck,
            title: "Citas reales, sin choques",
            body: "El agente consulta tu disponibilidad real en Google Calendar antes de ofrecer un horario.",
          },
          {
            icon: ChatCircleDots,
            title: "Tú siempre al mando",
            body: "Toma el control de cualquier conversación en un click; el bot se queda callado hasta que lo reactives.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-neutral-200 p-6">
            <Icon className="text-brand-600" size={28} weight="fill" />
            <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
