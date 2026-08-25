import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarCheck, ChatsCircle, PauseCircle } from "@phosphor-icons/react/dist/ssr";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import {
  getAppointmentsThisWeek,
  getConversationsLast30Days,
  getDailyActivity,
  getRecentConversations,
  getTodaysAppointments,
} from "@/lib/dashboard/queries";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ConversationsChart } from "@/components/dashboard/conversations-chart";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

export default async function DashboardPage() {
  const { supabase, organizationId, fullName } = await requireCurrentOrg();

  const { data: org } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", organizationId)
    .single();
  const timezone = org?.timezone ?? "America/Mexico_City";

  const [
    conversationsLast30Days,
    appointmentsThisWeek,
    dailyActivity,
    recentConversations,
    todaysAppointments,
  ] = await Promise.all([
    getConversationsLast30Days(supabase, organizationId),
    getAppointmentsThisWeek(supabase, organizationId, timezone),
    getDailyActivity(supabase, organizationId, timezone),
    getRecentConversations(supabase, organizationId, 5),
    getTodaysAppointments(supabase, organizationId, timezone),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">
          Hola{fullName ? `, ${fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-neutral-500">Así va tu negocio en WhatsApp.</p>
      </div>

      {/* Fila de resumen: conversaciones (30d), citas de la semana y "Citas
          de hoy" a la derecha (el orden importa: de mas amplio/general a
          mas inmediato, de izquierda a derecha). Las tres tarjetas comparten
          estructura (header con borde inferior + cuerpo) y la misma altura
          fija `h-40` (recortadas, mas anchas que altas -- ver KpiCard) para
          que se vean como un set homogeneo en vez de dos pildoras junto a un
          panel de lista; el contenido de esta, al variar en cantidad de
          citas, escapa por `overflow-y-auto` en vez de estirar la tarjeta. */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Conversaciones (últimos 30 días)"
          value={conversationsLast30Days}
          icon={ChatsCircle}
        />

        <KpiCard label="Citas esta semana" value={appointmentsThisWeek} icon={CalendarCheck} />

        <div className="flex h-40 flex-col rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">Citas de hoy</h2>
            <Link
              href="/citas"
              className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              Ver calendario
            </Link>
          </div>

          {todaysAppointments.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-5 text-center text-sm text-neutral-400">
              No hay citas agendadas para hoy.
            </p>
          ) : (
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto thin-scrollbar">
              {todaysAppointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">{a.fullName}</p>
                    <p className="truncate text-xs text-neutral-400">{a.service}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.status === "completed" && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                        Completada
                      </span>
                    )}
                    <span className="text-xs font-medium text-neutral-600">
                      {formatInTimeZone(a.startsAt, timezone, "HH:mm")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-6">
        <ConversationsChart data={dailyActivity} />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-neutral-900">Conversaciones recientes</h2>
        </div>

        {recentConversations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-400">
            Aún no hay conversaciones. Conecta WhatsApp en Integraciones para empezar a recibir mensajes.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentConversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/conversaciones/${c.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {c.contactName || c.contactPhone}
                    </p>
                    {c.contactName && (
                      <p className="truncate text-xs text-neutral-400">{c.contactPhone}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!c.botActive && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <PauseCircle size={11} weight="fill" />
                        Bot pausado
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">{relativeTime(c.lastMessageAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
