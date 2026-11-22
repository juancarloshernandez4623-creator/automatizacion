import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAppointmentReminders } from "@/lib/reminders/send-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diario de recordatorios de cita (programado en vercel.json). Vercel
 * lo llama con `Authorization: Bearer <CRON_SECRET>` cuando la variable
 * CRON_SECRET esta definida en el proyecto; cualquier otra peticion se
 * rechaza, porque este endpoint envia mensajes reales a pacientes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await sendAppointmentReminders(createAdminClient());
  return NextResponse.json(summary);
}
