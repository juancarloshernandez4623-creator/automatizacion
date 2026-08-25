import { addDays, startOfDay, subDays } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type RecentConversation = {
  id: string;
  contactName: string | null;
  contactPhone: string;
  lastMessageAt: string;
  botActive: boolean;
};

export type DailyActivityPoint = {
  /** yyyy-MM-dd, en la timezone de la organizacion. */
  date: string;
  conversationCount: number;
};

/** Conversaciones distintas con actividad en los últimos 30 días. */
export async function getConversationsLast30Days(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<number> {
  const cutoff = subDays(new Date(), 30).toISOString();
  const { count } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("last_message_at", cutoff);

  return count ?? 0;
}

/** Citas confirmadas o completadas dentro de la semana ISO actual (lun–dom), en la timezone de la organización. */
export async function getAppointmentsThisWeek(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  timezone: string,
): Promise<number> {
  const nowInOrgTz = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ss");
  const localNow = new Date(nowInOrgTz);
  const isoDayOfWeek = localNow.getDay() === 0 ? 7 : localNow.getDay(); // 1=lun … 7=dom
  const localMonday = startOfDay(subDays(localNow, isoDayOfWeek - 1));
  const localNextMonday = addDays(localMonday, 7);

  const weekStartUtc = fromZonedTime(localMonday, timezone);
  const weekEndUtc = fromZonedTime(localNextMonday, timezone);

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["confirmed", "completed"])
    .gte("starts_at", weekStartUtc.toISOString())
    .lt("starts_at", weekEndUtc.toISOString());

  return count ?? 0;
}

export type TodaysAppointment = {
  id: string;
  service: string;
  /** ISO en UTC -- se formatea a la hora local de la organización en el componente. */
  startsAt: string;
  fullName: string;
  phone: string;
  status: "confirmed" | "completed";
};

/** Citas confirmadas o completadas para el día de hoy, en la timezone de la organización, ordenadas por hora. */
export async function getTodaysAppointments(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  timezone: string,
): Promise<TodaysAppointment[]> {
  const nowInOrgTz = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ss");
  const localNow = new Date(nowInOrgTz);
  const localDayStart = startOfDay(localNow);
  const localDayEnd = addDays(localDayStart, 1);

  const dayStartUtc = fromZonedTime(localDayStart, timezone);
  const dayEndUtc = fromZonedTime(localDayEnd, timezone);

  const { data } = await supabase
    .from("appointments")
    .select("id, service, starts_at, full_name, phone, status")
    .eq("organization_id", organizationId)
    .in("status", ["confirmed", "completed"])
    .gte("starts_at", dayStartUtc.toISOString())
    .lt("starts_at", dayEndUtc.toISOString())
    .order("starts_at", { ascending: true });

  return (data ?? []).map((a) => ({
    id: a.id,
    service: a.service,
    startsAt: a.starts_at,
    fullName: a.full_name,
    phone: a.phone,
    status: a.status as TodaysAppointment["status"],
  }));
}

export async function getRecentConversations(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  limit = 5,
): Promise<RecentConversation[]> {
  const { data } = await supabase
    .from("conversations")
    .select("id, bot_active, last_message_at, contacts(full_name, wa_phone)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((c) => {
    const contact = c.contacts as { full_name: string | null; wa_phone: string } | null;
    return {
      id: c.id,
      contactName: contact?.full_name ?? null,
      contactPhone: contact?.wa_phone ?? "",
      lastMessageAt: c.last_message_at,
      botActive: c.bot_active,
    };
  });
}

/**
 * Conversaciones distintas con al menos un mensaje por día, últimos `days`
 * días (incluyendo hoy), en la timezone de la organización. Se calcula en
 * JS a partir de los mensajes crudos porque el cliente de Supabase no
 * expone `GROUP BY` sin una función RPC dedicada.
 */
export async function getDailyActivity(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  timezone: string,
  days = 14,
): Promise<DailyActivityPoint[]> {
  const cutoff = startOfDay(subDays(new Date(), days - 1));

  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true });

  const conversationsByDay = new Map<string, Set<string>>();
  for (const m of messages ?? []) {
    const dayKey = formatInTimeZone(m.created_at, timezone, "yyyy-MM-dd");
    const set = conversationsByDay.get(dayKey) ?? new Set<string>();
    set.add(m.conversation_id);
    conversationsByDay.set(dayKey, set);
  }

  const points: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    // Misma convención de bucket que arriba (formatInTimeZone en la
    // timezone de la organización) -- si se mezclara con formatISO en la
    // timezone del servidor (UTC en Vercel), las llaves no coincidirían y
    // el conteo saldría en 0 para cualquier org fuera de UTC.
    const dayKey = formatInTimeZone(day, timezone, "yyyy-MM-dd");
    points.push({
      date: dayKey,
      conversationCount: conversationsByDay.get(dayKey)?.size ?? 0,
    });
  }

  return points;
}
