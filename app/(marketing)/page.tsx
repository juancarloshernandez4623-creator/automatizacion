import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle,
  ChatCircleDots,
  InstagramLogo,
  LinkedinLogo,
  Phone,
  Question,
  Quotes,
  Robot,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { Logo, LogoMark } from "@/components/brand/logo";
import { FaqAccordion } from "./faq-accordion";

// Numero de contacto unico de Recepta: alimenta el link "Hablemos" del nav,
// el CTA de precios y el pie de pagina -- un solo cambio aqui se propaga a
// los 3 sitios si el numero cambia. El mismo numero atiende llamada y
// WhatsApp, de ahi que ambos hrefs deriven del mismo digito a digito.
const CONTACT_PHONE_DISPLAY = "+34 625 52 97 58";
const CONTACT_PHONE_HREF = "tel:+34625529758";
const WHATSAPP_HREF = "https://wa.me/34625529758";

const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: WHATSAPP_HREF,
    Icon: WhatsappLogo,
  },
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

// Seccion de "agitacion del problema": por que un WhatsApp sin responder
// cuesta clientes, y por que la personalizacion (no un bot generico) es la
// respuesta. El numero grande es solo un indice visual para escanear rapido
// -- no implica que sean pasos en orden (por eso va muy translucido, no
// como una cifra "importante" tipo las de STATS).
const REASONS = [
  {
    n: "1",
    title: "Un mensaje sin respuesta no espera",
    body: "Quien no recibe respuesta en minutos le escribe al siguiente negocio de la lista. No deja recado ni vuelve mañana: sigue de largo. Cada mensaje sin contestar es, en ese mismo minuto, un cliente hablando con la competencia.",
  },
  {
    n: "2",
    title: "No es un bot genérico, es tu negocio hablando",
    body: "Recepta se personaliza al máximo: conoce tus servicios, tus precios, tu tono y tus reglas. Responde como tú lo harías — y cuando algo se sale de lo que sabe, te pasa la conversación con el contexto ya resuelto.",
  },
  {
    n: "3",
    title: "Atiende también cuando tú no puedes",
    body: "Fuera de horario, el fin de semana, en medio de una cita con otro cliente. El WhatsApp suena y alguien responde, sin importar la hora.",
  },
  {
    n: "4",
    title: "Se adapta a cómo trabajas, no al revés",
    body: "Se conecta a tu calendario, aprende tus servicios y sigue tus propias reglas sobre cuándo pasarte una conversación. No cambias tu forma de trabajar ni aprendes un programa nuevo.",
  },
];

// Diagrama "con Recepta" vs "sin gestionar" -- los pasos intermedios de cada
// camino, mas un nodo final distinto (check / interrogante) que se renderiza
// aparte para no repetir el resultado dentro de la lista de pasos.
const FLOW_WITH_STEPS = ["Mensaje recibido", "Responde al instante", "Duda resuelta"] as const;
const FLOW_WITHOUT_STEPS = [
  "Mensaje recibido",
  "Sigue sin leer",
  "El cliente espera",
  "Escribe a otro negocio",
] as const;

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

// En vez de una foto de una persona (no tenemos recepcionistas reales que
// fotografiar, y una imagen de stock presentada como "nuestro equipo" seria
// enganosa) mostramos, tal cual, que datos configura el agente -- es una
// prueba mas honesta y mas relevante de "personalizacion maxima" que un
// retrato generico.
const BUSINESS_PROFILE_FACTS = [
  "Servicios y precios exactos de tu negocio",
  "Horario real, con tus excepciones y días cerrados",
  "Tono y estilo con el que ya le hablas a tus clientes",
  "Reglas claras de cuándo pasarte la conversación a ti",
];

const COMPARISON_ROWS = [
  {
    label: "Responde fuera de horario",
    recepta: true,
    sinGestionar: false,
    personaContratada: false,
  },
  {
    label: "Agenda la cita en la misma conversación",
    recepta: true,
    sinGestionar: false,
    personaContratada: true,
  },
  {
    label: "Sin turnos ni bajas que cubrir",
    recepta: true,
    sinGestionar: true,
    personaContratada: false,
  },
  {
    label: "Absorbe picos de mensajes sin aviso previo",
    recepta: true,
    sinGestionar: false,
    personaContratada: false,
  },
  {
    label: "Deja registro escrito de cada conversación",
    recepta: true,
    sinGestionar: "a veces",
    personaContratada: "a veces",
  },
] as const;

const PRICING = [
  {
    tag: "Pago único",
    title: "Puesta en marcha",
    price: "1.500 €",
    cadence: "instalación inicial · IVA incluido",
    // null (no undefined) para que TS infiera el mismo tipo en ambos
    // elementos del array y no haga falta anotar PRICING a mano.
    billingNote: null as string | null,
    items: [
      "Conexión completa de tu WhatsApp Business y tu Google Calendar",
      "Configuración del agente con el tono y los servicios que ofreces por WhatsApp",
      "Prueba supervisada con mensajes de WhatsApp reales antes de activar",
    ],
  },
  {
    tag: "Cada mes",
    title: "Suscripción Recepta",
    price: "299,99 €",
    cadence: "al mes · IVA incluido",
    billingNote: "El primer mes no se cobra — empiezas a pagar a partir del segundo",
    items: [
      "Agente de IA activo 24/7, sin límite de conversaciones",
      "Agenda de citas conectada a tu Google Calendar",
      "Soporte continuo y ajustes de configuración incluidos",
    ],
  },
];

// Reseñas reales, publicadas sin nombre, cargo ni foto -- decision
// explicita del propio negocio (no una foto de stock presentada como si
// fuera un cliente real, que si seria enganoso).
const TESTIMONIALS = [
  "«Dejamos de perder consultas de fin de semana. Los lunes ya no arrancamos devolviendo llamadas: arrancamos con la agenda llena.»",
  "«Lo que más me sorprendió es que los clientes no se dan cuenta de que no somos nosotros. Atienden con nuestro nombre, saben los precios y resuelven. Cuando algo no lo pueden resolver, me llega ya resumido y sé exactamente de qué se trata antes de llamar.»",
  "«Simple: el teléfono dejó de ser un problema. Y por primera vez tengo registro de todo lo que se habla con nuestros clientes.»",
] as const;

// Fila de una celda de la tabla comparativa: true/false se dibujan como
// icono, "a veces" se deja como texto -- evita forzar un tercer icono para
// un caso que en realidad es ambiguo.
function ComparisonCell({ value }: { value: boolean | "a veces" }) {
  if (value === true) {
    return <CheckCircle className="mx-auto text-brand-400" size={20} weight="fill" />;
  }
  if (value === false) {
    return <X className="mx-auto text-ink-500" size={16} />;
  }
  return <span className="text-xs text-ink-500">{value}</span>;
}

// Un camino del diagrama "que cambia cuando Recepta atiende". `active`
// controla el estilo (verde marca y protagonismo vs. gris apagado) y que
// icono de cierre se dibuja -- no hay logica distinta mas alla de eso.
function FlowPath({
  label,
  steps,
  active,
}: {
  label: string;
  steps: readonly string[];
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-4 sm:gap-6">
      <p
        className={`w-20 shrink-0 pt-[3px] text-right text-xs font-medium sm:w-28 ${
          active ? "text-brand-400" : "text-ink-500"
        }`}
      >
        {label}
      </p>
      <div className="relative min-w-0 flex-1">
        <div
          aria-hidden="true"
          className={`absolute left-0 right-0 top-[5px] h-px ${
            active ? "bg-brand-500/50" : "bg-white/15"
          }`}
        />
        <div className="relative flex items-start justify-between gap-2">
          {steps.map((step) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-[11px] w-[11px] shrink-0 rounded-full border-2 border-noir-950 ${
                  active ? "bg-brand-400" : "bg-white/30"
                }`}
              />
              <span
                className={`max-w-[5.5rem] text-center text-xs leading-tight ${
                  active ? "text-ink-50" : "text-ink-500"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            {active ? (
              <CheckCircle className="text-brand-400" size={18} weight="fill" />
            ) : (
              <Question className="text-gold-500" size={18} weight="fill" />
            )}
            <span
              className={`max-w-[5.5rem] text-center text-xs font-medium leading-tight ${
                active ? "text-brand-400" : "text-gold-500"
              }`}
            >
              {active ? "Cita agendada" : "Cliente perdido"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            <a href="#preguntas" className="hidden text-ink-300 hover:text-ink-50 sm:inline">
              Preguntas
            </a>
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-1.5 text-ink-300 hover:text-ink-50"
            >
              <Phone size={16} weight="fill" />
              Hablemos
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escríbenos por WhatsApp"
              className="text-ink-300 hover:text-ink-50"
            >
              <WhatsappLogo size={18} weight="fill" />
            </a>
            <Link href="/login" className="text-ink-300 hover:text-ink-50">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-ink-50 px-4 py-2 font-semibold text-noir-950 hover:bg-white"
            >
              Crear cuenta
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
            {/* CTA unico del hero: reservar una llamada gratuita, en vez de
                un doble boton "crear cuenta / hablemos" -- este negocio se
                activa con una instalacion guiada, no con un alta de
                autoservicio, asi que el CTA mas fuerte de la pagina apunta
                directo a esa conversacion. */}
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 rounded-lg bg-ink-50 px-6 py-3 font-semibold text-noir-950 hover:bg-white"
            >
              <CalendarCheck size={18} weight="fill" />
              Agendar mi llamada gratuita
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-semibold text-ink-50 hover:border-brand-400 hover:text-brand-400"
            >
              <WhatsappLogo size={18} weight="fill" />
              Escríbenos por WhatsApp
            </a>
          </div>
          <p className="mt-4 text-xs text-ink-500">
            Gratis y sin compromiso · 20 minutos · mismo número para llamada o WhatsApp
          </p>
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

      {/* Razones -- agitacion del problema (mensaje perdido = cliente
          perdido) y la respuesta (personalizacion maxima, no un bot
          generico), antes de explicar el mecanismo. */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-2xl font-medium text-balance text-ink-50 sm:text-3xl">
            4 razones para no perder ni un mensaje más
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {REASONS.map((r) => (
            <div
              key={r.n}
              className="flex gap-5 rounded-2xl border border-white/10 bg-noir-900/50 p-6"
            >
              <span className="font-mono-brand shrink-0 select-none text-4xl font-semibold text-gold-300 sm:text-5xl">
                {r.n}
              </span>
              <div>
                <h3 className="font-semibold text-ink-50">{r.title}</h3>
                <p className="mt-2 text-sm text-ink-300">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona -- el diagrama es la explicacion: mas fuerte que una
          lista de pasos en texto porque el contraste "3 pasos y check" vs
          "5 pasos y cliente perdido" se ve de un vistazo. */}
      <section id="como-funciona" className="scroll-mt-20 border-y border-white/10 bg-noir-900/40">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-xl text-center">
            <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-300">
              Menos pasos, más citas agendadas
            </p>
            <h2 className="mt-3 text-2xl font-medium text-balance text-ink-50 sm:text-3xl">
              Esto es lo que cambia cuando Recepta responde
            </h2>
            <p className="mt-4 text-sm text-ink-300">
              Del mensaje a la cita confirmada, en la misma conversación. Sin
              esperas, sin que el cliente tenga que insistir.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <FlowPath label="Con Recepta" steps={FLOW_WITH_STEPS} active />
            <FlowPath label="Sin gestionar" steps={FLOW_WITHOUT_STEPS} active={false} />
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

      {/* Confianza / personalizacion -- en vez de una foto de "nuestro
          equipo" (no tenemos una que mostrar, y una de stock presentada
          como real seria enganosa), mostramos literalmente que datos
          configura el agente. Es mas honesto y mas convincente. */}
      <section className="border-y border-white/10 bg-noir-900/40">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-24 sm:grid-cols-2 sm:gap-14">
          <div>
            <p className="font-mono-brand text-xs font-medium uppercase tracking-[0.25em] text-gold-300">
              Por qué confiar en Recepta
            </p>
            <h2 className="mt-3 text-2xl font-medium text-balance text-ink-50 sm:text-3xl">
              Nos dedicamos únicamente a que tu WhatsApp nunca se quede sin
              respuesta.
            </h2>
            <p className="mt-5 text-sm text-ink-300">
              Para la mayoría de los negocios, contestar WhatsApp es la
              interrupción que corta el trabajo real. Para Recepta es lo único
              que hace — por eso lo hace bien.
            </p>
            <p className="mt-4 text-sm text-ink-300">
              Cada agente se configura sobre tu negocio antes del primer
              mensaje: qué vendes, cuánto cuesta, qué agenda maneja, qué
              preguntas puede responder y cuáles tienes que responder tú. No
              improvisa ni inventa: cuando no sabe algo, lo dice y te pasa la
              conversación con el contexto listo.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-noir-900/70 p-6 sm:p-7">
            <p className="font-mono-brand text-xs uppercase tracking-[0.2em] text-ink-500">
              Lo que el agente aprende de tu negocio
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {BUSINESS_PROFILE_FACTS.map((fact) => (
                <li key={fact} className="flex items-start gap-3 text-sm text-ink-50">
                  <CheckCircle
                    className="mt-0.5 shrink-0 text-brand-400"
                    size={18}
                    weight="fill"
                  />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Comparativa -- misma paleta oscura que el resto (nunca un bloque
          blanco suelto solo por costumbre de dashboard/tabla): la columna
          Recepta se distingue por un tinte dorado, no por cambiar de tema. */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-medium text-balance text-ink-50 sm:text-3xl">
            Cómo nos comparamos
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[540px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left font-normal text-ink-500"></th>
                <th className="font-mono-brand bg-gold-500/10 p-4 text-center text-xs uppercase tracking-wide text-gold-300">
                  Recepta
                </th>
                <th className="p-4 text-center text-xs font-normal text-ink-500">
                  Sin gestionar
                </th>
                <th className="p-4 text-center text-xs font-normal text-ink-500">
                  Persona contratada
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-white/5 last:border-0">
                  <td className="p-4 text-ink-50">{row.label}</td>
                  <td className="bg-gold-500/5 p-4">
                    <ComparisonCell value={row.recepta} />
                  </td>
                  <td className="p-4">
                    <ComparisonCell value={row.sinGestionar} />
                  </td>
                  <td className="p-4">
                    <ComparisonCell value={row.personaContratada} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <span className="text-sm text-ink-300">{plan.cadence}</span>
                </p>
                {plan.billingNote ? (
                  <p className="mt-2 text-xs font-medium text-gold-300">{plan.billingNote}</p>
                ) : null}
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

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="max-w-md text-center">
              <p className="font-semibold text-ink-50">¿Todavía no lo decides?</p>
              <p className="mt-1 text-ink-50">Agenda una llamada con nosotros 👇</p>
              <p className="mt-3 text-sm text-ink-300">
                Veinte minutos para estimar cuántos clientes estás perdiendo
                hoy por no responder a tiempo en WhatsApp, y qué cambiaría
                si los atendiéramos nosotros.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={CONTACT_PHONE_HREF}
                className="flex items-center gap-2 rounded-lg bg-ink-50 px-6 py-3 font-semibold text-noir-950 hover:bg-white"
              >
                <Phone size={18} weight="fill" />
                Hablemos y lo activamos
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-semibold text-ink-50 hover:border-brand-400 hover:text-brand-400"
              >
                <WhatsappLogo size={18} weight="fill" />
                Escríbenos por WhatsApp
              </a>
            </div>
            <p className="text-xs text-ink-500">
              Respuesta el mismo día · configurado en 24 horas
            </p>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section id="preguntas" className="scroll-mt-20 mx-auto max-w-3xl px-6 py-24">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-medium text-ink-50 sm:text-3xl">Preguntas frecuentes</h2>
        </div>
        <FaqAccordion />
      </section>

      {/* Testimonios */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-medium text-ink-50 sm:text-3xl">
            Lo que dicen los que ya no atienden su teléfono
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((quote) => (
            <figure
              key={quote}
              className="flex flex-col rounded-2xl border border-white/10 bg-noir-900/50 p-6"
            >
              <Quotes className="text-gold-300" size={26} weight="fill" />
              <blockquote className="mt-3 flex-1 text-sm italic text-ink-300">
                {quote}
              </blockquote>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA final -- refuerza la conversion al cierre del recorrido: quien
          llega hasta aqui ya leyo el FAQ y las reseñas, asi que se le da
          otra oportunidad clara de actuar sin tener que volver a subir
          hasta Precios. */}
      <section className="border-t border-white/10 bg-noir-900/40">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-2xl font-medium text-balance text-ink-50 sm:text-3xl">
            Cada minuto sin responder, alguien elige a otro negocio.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-ink-300">
            Cuéntanos cómo trabaja tu negocio y en un día tienes el agente
            respondiendo por ti en WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 rounded-lg bg-ink-50 px-6 py-3 font-semibold text-noir-950 hover:bg-white"
            >
              <Phone size={18} weight="fill" />
              Hablemos
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-semibold text-ink-50 hover:border-brand-400 hover:text-brand-400"
            >
              <WhatsappLogo size={18} weight="fill" />
              Escríbenos por WhatsApp
            </a>
          </div>
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
              <p className="mt-1 text-sm text-ink-300">
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
