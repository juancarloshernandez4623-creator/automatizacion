import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import type { Database } from "@/lib/database.types";
import { decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send-template";
import { insertOutboundMessage, upsertConversation } from "@/lib/whatsapp/persist-message";

/** No se recuerda una cita reservada hace menos de esto: el paciente la acaba de pedir. */
const SKIP_IF_BOOKED_WITHIN_MS = 3 * 60 * 60 * 1000;

export type ReminderRunSummary = {
  organizations: number;
  sent: number;
  skipped: number;
  failed: number;
};

/**
 * Envia por WhatsApp el recordatorio de las citas de MAÑANA (en la zona
 * horaria de cada negocio) a todos los negocios que lo tengan activado.
 * Pensado para ejecutarse una vez al dia (ver app/api/cron/reminders y
 * vercel.json): con un cron diario basta con "todas las citas de mañana
 * sin recordatorio", sin ventanas horarias que puedan solaparse o saltarse.
 *
 * El recordatorio se guarda tambien como mensaje del bot en la
 * conversacion, para que cuando el paciente responda ("Confirmo" /
 * "Necesito cambiarla") el agente tenga el contexto de a que responde.
 */
export async function sendAppointmentReminders(
  admin: SupabaseClient<Database>,
  now: Date = new Date(),
): Promise<ReminderRunSummary> {
  const summary: ReminderRunSummary = { organizations: 0, sent: 0, skipped: 0, failed: 0 };

  const { data: configs, error: configsError } = await admin
    .from("whatsapp_configs")
    .select(
      "organization_id, phone_number_id, access_token_encrypted, reminder_template_name, reminder_template_language, organizations(name, timezone)",
    )
    .eq("reminders_enabled", true)
    .not("reminder_template_name", "is", null);

  if (configsError) {
    logger.error({ event: "reminders_load_configs_failed", error: configsError.message });
    return summary;
  }

  for (const config of configs ?? []) {
    summary.organizations++;
    const org = config.organizations as unknown as { name: string; timezone: string } | null;
    const timezone = org?.timezone ?? "Europe/Madrid";
    const organizationName = org?.name ?? "la clínica";

    // "Mañana" en la zona horaria del negocio, como rango UTC [inicio, fin).
    const todayLocal = formatInTimeZone(now, timezone, "yyyy-MM-dd");
    const tomorrowLocal = format(addDays(parseISO(todayLocal), 1), "yyyy-MM-dd");
    const dayAfterLocal = format(addDays(parseISO(todayLocal), 2), "yyyy-MM-dd");
    const rangeStart = fromZonedTime(`${tomorrowLocal}T00:00:00`, timezone);
    const rangeEnd = fromZonedTime(`${dayAfterLocal}T00:00:00`, timezone);

    const { data: appointments, error } = await admin
      .from("appointments")
      .select("id, contact_id, full_name, phone, service, starts_at, created_at")
      .eq("organization_id", config.organization_id)
      .eq("status", "confirmed")
      .is("reminder_sent_at", null)
      .gte("starts_at", rangeStart.toISOString())
      .lt("starts_at", rangeEnd.toISOString())
      .order("starts_at", { ascending: true });

    if (error) {
      logger.error({
        event: "reminders_load_appointments_failed",
        organization_id: config.organization_id,
        error: error.message,
      });
      continue;
    }
    if (!appointments || appointments.length === 0) continue;

    let accessToken: string;
    try {
      accessToken = decrypt(config.access_token_encrypted);
    } catch {
      logger.error({ event: "reminders_decrypt_failed", organization_id: config.organization_id });
      summary.failed += appointments.length;
      continue;
    }

    for (const appointment of appointments) {
      const phone = appointment.phone.replace(/[\s-]/g, "");
      // Citas importadas de Calendar o sin telefono valido: no hay a quien escribir.
      if (!/^\+?\d{8,15}$/.test(phone)) {
        summary.skipped++;
        continue;
      }
      if (now.getTime() - new Date(appointment.created_at).getTime() < SKIP_IF_BOOKED_WITHIN_MS) {
        summary.skipped++;
        continue;
      }

      const startsLocal = toZonedTime(new Date(appointment.starts_at), timezone);
      const dateLabel = format(startsLocal, "EEEE d 'de' MMMM", { locale: es });
      const timeLabel = format(startsLocal, "HH:mm");
      const firstName = appointment.full_name.trim().split(/\s+/)[0] || appointment.full_name;

      const result = await sendWhatsAppTemplate({
        phoneNumberId: config.phone_number_id,
        accessToken,
        to: phone,
        templateName: config.reminder_template_name!,
        languageCode: config.reminder_template_language,
        bodyParameters: [firstName, organizationName, dateLabel, timeLabel],
      });

      if (!result.ok) {
        summary.failed++;
        logger.error({
          event: "reminder_send_failed",
          organization_id: config.organization_id,
          appointment_id: appointment.id,
          error: result.error,
        });
        continue;
      }

      await admin
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);

      try {
        const conversation = await upsertConversation(admin, {
          organizationId: config.organization_id,
          contactId: appointment.contact_id,
        });
        await insertOutboundMessage(admin, {
          conversationId: conversation.id,
          organizationId: config.organization_id,
          waMessageId: result.waMessageId,
          content: `[Recordatorio automático] Hola ${firstName}, le recordamos su cita de ${appointment.service} en ${organizationName} el ${dateLabel} a las ${timeLabel}. ¿Nos confirma su asistencia? Si no puede venir, respóndanos y la cambiamos.`,
          sender: "bot",
        });
      } catch (err) {
        // El recordatorio ya salio; no guardarlo en el hilo no debe contarse como fallo.
        logger.warn({
          event: "reminder_persist_failed",
          organization_id: config.organization_id,
          appointment_id: appointment.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      summary.sent++;
    }
  }

  logger.info({ event: "reminders_run_finished", ...summary });
  return summary;
}
