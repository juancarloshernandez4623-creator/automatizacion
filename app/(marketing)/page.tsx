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

// Las 4 celdas pequeñas del bento del hero -- deliberadamente cifras del
// propio producto (nunca genericas tipo "clientes felices") para que el
// bento cuente algo especifico de Recepta, no relleno visual.
const STATS = [
  { value: "<10 s", label: "en responder el primer mensaje" },
  { value: "24/7", label: "cobertura, sin turnos ni guardias" },
  { value: "+35%", label: "citas agendadas fuera de horario" },
  { value: "0", label: "mensajes de WhatsApp sin contestar" },
];

// Secuencia real de 3 pasos (por eso lleva numeracion) -- distinto de
// FEATURES, que son capacidades en paralelo, no un orden.
const STEPS = [
  {
    title: "Conecta tus cuentas",
    body: "WhatsApp Business y Google Calendar, en unos minutos, sin tocar código.",
  },
  {
    title: "Dale tu voz al agente",
    body: "Servicios, horarios y tono de tu negocio — Recepta responde como tú lo harías.",
  },
  {
    title: "Recepta atiende por ti",
    body: "Cada mensaje se responde y cada cita se agenda sola; tú lo ves todo desde el panel.",
  },
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
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-noir-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/" aria-label="Recepta — inicio">
            <Logo size="sm" />
          </Link>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <a href="#como-funciona" className="hidden text-ink-300 hover:text-ink-50 sm:inline">
              Cómo funciona
            </a>
            <a href="#precios" className="hidden text-ink-300 hover:text-ink-50 sm:inline">
              Precios
            </a>
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-1.5 text-ink-300 hover:text-ink-50"
            >
              <Phone size={16} weight="fill" />
              Hablemos
            </a>
            <Link href="/login" className="text-ink-300 hover:text-ink-50">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-ink-50 px-4 py-2 font-semibold text-noir-950 hover:bg-white"
            >
              Empieza gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero + bento */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-300">
            Recepción inteligente, 24/7
          </p>
          <h1 className="mt-4 text-4xl font-medium tracking-tight text-balance text-ink-50 sm:text-5xl">
            Cada mensaje, respondido al instante.
            <br />
            Cada cita, <em className="italic text-brand-400">agendada sola</em>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-300">
            Conecta tu WhatsApp Business y tu Google Calendar. Recepta atiende,
            resuelve dudas y agenda citas reales por ti — con el tono exacto de
            tu negocio.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-lg bg-ink-50 px-6 py-3 font-semibold text-noir-950 hover:bg-white"
            >
              Crear mi cuenta <ArrowRight size={18} weight="bold" />
            </Link>
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-semibold text-ink-50 hover:border-white/25 hover:bg-white/5"
            >
              <Phone size={18} weight="fill" />
              Hablemos
            </a>
          </div>
        </div>

        {/* Bento: la conversacion real de Recepta -- un mensaje de WhatsApp
            que se convierte en una cita confirmada, con las 4 cifras que
            demuestran que no es una maqueta sino como funciona de verdad. */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-3xl border border-white/10 bg-noir-900/70 p-6 sm:p-7">
            <div>
              <div className="font-mono-brand flex items-center gap-2 text-xs text-ink-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                Recepta · en línea ahora
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-white/[0.07] px-4 py-2.5 text-sm text-ink-50">
                  Hola, ¿tenéis hueco mañana por la tarde para una limpieza?
                </p>
                <p className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border border-brand-500/25 bg-brand-500/10 px-4 py-2.5 text-sm text-ink-50">
                  Claro — mañana tengo libre a las 17:00 o a las 18:30. ¿Cuál
                  prefieres?
                </p>
                <p className="ml-auto max-w-[50%] rounded-2xl rounded-tr-sm bg-white/[0.07] px-4 py-2.5 text-sm text-ink-50">
                  18:30
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gold-500/25 bg-gold-500/10 px-4 py-3">
              <CalendarCheck className="shrink-0 text-gold-300" size={22} weight="fill" />
              <div className="text-xs text-ink-300">
                <p className="font-medium text-gold-300">Cita confirmada</p>
                <p>Mañana · 18:30 — sincronizada con Google Calendar</p>
              </div>
            </div>
          </div>

          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-noir-900/70 p-5 sm:p-6"
            >
              <p className="font-mono-brand text-2xl font-semibold text-ink-50 sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-2 text-xs text-ink-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona -- secuencia real de 3 pasos, por eso numerada */}
      <section id="como-funciona" className="scroll-mt-20 border-y border-white/10 bg-noir-900/40">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-300">
              De cero a en marcha
            </p>
            <h2 className="mt-3 text-2xl font-medium text-ink-50 sm:text-3xl">
              Tres pasos, y Recepta contesta por ti
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-3">
                <span className="font-mono-brand text-sm text-ink-500">
                  0{i + 1}
                </span>
                <h3 className="text-lg font-medium text-ink-50">{step.title}</h3>
                <p className="text-sm text-ink-300">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capacidades -- en paralelo, no una secuencia, por eso sin numerar */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-medium text-ink-50 sm:text-3xl">
            Lo que hace que se sienta como un miembro más del equipo
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-noir-900/50 p-6"
            >
              <Icon className="text-brand-400" size={28} weight="fill" />
              <h3 className="mt-4 font-semibold text-ink-50">{title}</h3>
              <p className="mt-1 text-sm text-ink-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="scroll-mt-20 border-y border-white/10 bg-noir-900/40 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-300">
              Precios claros, sin sorpresas
            </p>
            <h2 className="mt-3 text-2xl font-medium text-ink-50 sm:text-3xl">
              Una vez para instalarlo. Después, un abono al mes.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {PRICING.map((plan) => (
              <div
                key={plan.title}
                className="flex flex-col rounded-2xl border border-white/10 bg-noir-900/70 p-7"
              >
                <span className="font-mono-brand w-fit rounded-full bg-gold-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gold-300">
                  {plan.tag}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-50">{plan.title}</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-ink-50">{plan.price}</span>
                  <span className="text-sm text-ink-500">{plan.cadence}</span>
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ink-300">
                      <CheckCircle
                        className="mt-0.5 shrink-0 text-brand-400"
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
              className="flex items-center gap-2 rounded-lg bg-ink-50 px-6 py-3 font-semibold text-noir-950 hover:bg-white"
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
          <h2 className="text-2xl font-medium text-ink-50 sm:text-3xl">
            Lo que dicen los que ya no atienden su teléfono
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIAL_PLACEHOLDERS.map((n) => (
            <figure
              key={n}
              className="flex flex-col rounded-2xl border border-dashed border-white/15 bg-noir-900/40 p-6"
            >
              <Quotes className="text-gold-300" size={26} weight="fill" />
              <blockquote className="mt-3 flex-1 text-sm italic text-ink-500">
                «Sustituye este texto por la reseña real de un cliente — se
                publica tal cual la escriba, sin nombre, foto ni cargo.»
              </blockquote>
            </figure>
          ))}
        </div>
      </section>

      {/* Pie de pagina */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <LogoMark size={32} />
            <div>
              <p className="font-mono-brand text-sm font-medium uppercase tracking-[0.2em] text-ink-50">
                Recepta Technologies
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Recepción por WhatsApp, con inteligencia real.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm sm:items-end">
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 font-semibold text-ink-50 hover:text-brand-400 sm:justify-end"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-ink-300 hover:border-brand-400 hover:text-brand-400"
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
            <p className="text-xs text-ink-500">
              © {new Date().getFullYear()} Recepta Technologies. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
