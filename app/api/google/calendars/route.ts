import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireCurrentOrg, UnauthorizedError } from "@/lib/auth/current-org";
import { decrypt } from "@/lib/crypto";
import { getAuthenticatedClient } from "@/lib/google/oauth";

export const runtime = "nodejs";

/**
 * Lista los calendarios de Google del usuario conectado, para el selector
 * de `calendar_id` en /integraciones. Requiere sesion (usa RLS via
 * requireCurrentOrg -> createClient de servidor).
 */
export async function GET() {
  try {
    const { supabase, organizationId } = await requireCurrentOrg();

    const { data: config } = await supabase
      .from("google_calendar_configs")
      .select("refresh_token_encrypted, access_token_encrypted")
      .eq("organization_id", organizationId)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: "Google Calendar no esta conectado." },
        { status: 404 },
      );
    }

    const auth = getAuthenticatedClient(
      decrypt(config.refresh_token_encrypted),
      config.access_token_encrypted ? decrypt(config.access_token_encrypted) : null,
    );
    const calendar = google.calendar({ version: "v3", auth });

    const { data } = await calendar.calendarList.list();
    const calendars = (data.items ?? []).map((item) => ({
      id: item.id ?? "",
      summary: item.summary ?? item.id ?? "",
      primary: Boolean(item.primary),
    }));

    return NextResponse.json({ calendars });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No pudimos listar tus calendarios de Google." },
      { status: 500 },
    );
  }
}
