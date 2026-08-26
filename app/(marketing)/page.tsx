import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  ChatCircleDots,
  InstagramLogo,
  LinkedinLogo,
  Phone,
  Quotes,
  Robot,
} from "@phosphor-icons/react/dist/ssr";
import { Logo, LogoMark } from "@/components/brand/logo";

// Numero de contacto unico de Recepta: alimenta el link "Hablemos" del nav,
// el CTA de precios y el pie de pagina -- un solo cambio aqui se propaga a
// los 3 sitios si el numero cambia.
const CONTACT_PHONE_DISPLAY = "+34 625 52 97 58";
const CONTACT_PHONE_HREF = "tel:+34625529758";

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/recepta.vercel.app/?viewAsMember=true",
    Icon: LinkedinLogo,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/recepta_technologies?igsi=MXJwZnp4eW5ic21heA%3D%3D&utm_source=qr",
    Icon: InstagramLogo,
  },
];

const STATS = [
  { value: "<10 s", label: "en responder el primer mensaje" },
  { value: "24/7", label: "cobertura, sin turnos ni guardias" },
  { value: "+35%", label: "citas agendadas fuera de horario" },
  { value: "0", label: "mensajes de WhatsApp sin contestar" },
];

const FEATURES = [
  {
    icon: Robot,
    title: "Agente con tu propia voz",
    body: "Escribe el prompt, el tono y la información de tu negocio; el agente responde exactamente como tú quieres que lo haga.",
  },
  {
    icon: CalendarCheck,
    title: "Citas reales, sin choques",
    body: "Antes de ofrecer un horario, Recepta consulta tu disponibilidad real en Google Calendar — nunca una cita duplicada.",
  },
  {
    icon: ChatCircleDots,
    title: "Tú siempre al mando",
    body: "Toma el control de cualquier conversación en un clic; el agente se queda en silencio hasta que lo reactives.",
  },
];

const PRICING = [
  {
    tag: "Pago único",
    title: "Puesta en marcha",
    price: "1.500 €",
    cadence: "instalación inicial",
    items: [
      "Conexión completa de tu WhatsApp Business y tu Google Calendar",
      "Configuración del agente con la voz y los servicios de tu negocio",
      "Prueba supervisada con llamadas y mensajes de WhatsApp reales antes de activar",
    ],
  },
  {
    tag: "Cada mes",
    title: "Suscripción Recepta",
    price: "299,99 €",
    cadence: "al mes",
    items: [
      "Agente de IA activo 24/7, sin límite de conversaciones",
      "Agenda de citas conectada a tu Google Calendar",
      "Soporte continuo y ajustes de configuración incluidos",
    ],
  },
];

// Placeholders deliberados: no hay reseñas reales de clientes todavia. El
// texto en cursiva es una instruccion visible para quien edite la pagina,
// nunca una cita inventada presentada como si fuera de un cliente real --
// sustituir por el testimonio real (tal cual lo escriba el cliente) en
// cuanto se tenga.
const TESTIMONIAL_PLACEHOLDERS = [1, 2, 3];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/" aria-label="Recepta — inicio">
            <Logo size="sm" />
          </Link>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a
              href="#como-funciona"
              className="hidden text-neutral-600 hover:text-neutral-900 sm:inline"
            >
              Cómo funciona
            </a>
            <a href="#precios" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">
              Precios
            </a>
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900"
            >
              <Phone size={16} weight="fill" />
              Hablemos
            </a>
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
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-700">
          Recepción inteligente, 24/7
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl">
          Cada mensaje, respondido al instante.
          <br />
          Cada cita, <em className="italic text-brand-700">agendada sola</em>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-600">
          Conecta tu WhatsApp Business y tu Google Calendar. Recepta atiende,
          resuelve dudas y agenda citas reales por ti — con el tono exacto de
          tu negocio.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Crear mi cuenta <ArrowRight size={18} weight="bold" />
          </Link>
          <a
            href={CONTACT_PHONE_HREF}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            <Phone size={18} weight="fill" />
            Hablemos
          </a>
        </div>
      </section>

      {/* Cifras */}
      <section className="border-y border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-mono-brand text-2xl font-semibold text-brand-700 sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-medium text-neutral-900 sm:text-3xl">
            Así funciona, de principio a fin
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-neutral-200 p-6">
              <Icon className="text-brand-600" size={28} weight="fill" />
              <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="scroll-mt-20 bg-neutral-50/60 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-700">
              Precios claros, sin sorpresas
            </p>
            <h2 className="mt-3 text-2xl font-medium text-neutral-900 sm:text-3xl">
              Una vez para instalarlo. Después, un abono al mes.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {PRICING.map((plan) => (
              <div
                key={plan.title}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-7"
              >
                <span className="font-mono-brand w-fit rounded-full bg-gold-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold-700">
                  {plan.tag}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{plan.title}</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-neutral-900">{plan.price}</span>
                  <span className="text-sm text-neutral-500">{plan.cadence}</span>
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
                      <CheckCircle
                        className="mt-0.5 shrink-0 text-brand-600"
                        size={18}
                        weight="fill"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
            >
              <Phone size={18} weight="fill" />
              Hablemos y lo activamos
            </a>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-medium text-neutral-900 sm:text-3xl">
            Lo que dicen los que ya no atienden su teléfono
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIAL_PLACEHOLDERS.map((n) => (
            <figure
              key={n}
              className="flex flex-col rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 p-6"
            >
              <Quotes className="text-gold-500" size={26} weight="fill" />
              <blockquote className="mt-3 flex-1 text-sm italic text-neutral-500">
                «Sustituye este texto por la reseña real de un cliente — se
                publica tal cual la escriba, sin nombre, foto ni cargo.»
              </blockquote>
            </figure>
          ))}
        </div>
      </section>

      {/* Pie de pagina */}
      <footer className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <LogoMark size={32} />
            <div>
              <p className="font-mono-brand text-sm font-medium uppercase tracking-[0.2em] text-neutral-700">
                Recepta Technologies
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Recepción por WhatsApp, con inteligencia real.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm sm:items-end">
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 font-semibold text-neutral-700 hover:text-brand-700 sm:justify-end"
            >
              <Phone size={16} weight="fill" />
              {CONTACT_PHONE_DISPLAY}
            </a>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:border-brand-600 hover:text-brand-600"
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              © {new Date().getFullYear()} Recepta Technologies. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
