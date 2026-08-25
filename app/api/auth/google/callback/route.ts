import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";

/**
 * Callback de Google OAuth2 tras conectar Google Calendar desde
 * /integraciones. `state` lleva el organization_id que arranco el flujo
 * (ver lib/google/oauth.ts#buildGoogleAuthUrl); se valida contra la sesion
 * actual para que un `state` manipulado no pueda asociar tokens a una
 * organizacion distinta a la del usuario logueado.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const redirectWithError = (message: string) =>
    NextResponse.redirect(`${origin}/integraciones?googleError=${encodeURIComponent(message)}`);

  if (oauthError) {
    return redirectWithError("Cancelaste la conexion con Google.");
  }
  if (!code || !state) {
    return redirectWithError("Respuesta de Google incompleta.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirectWithError("Tu sesion expiro, inicia sesion de nuevo.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id || profile.organization_id !== state) {
    return redirectWithError("La solicitud de conexion no es valida.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      // Puede pasar si el usuario ya habia dado consentimiento antes y
      // Google no reemite el refresh_token. buildGoogleAuthUrl ya fuerza
      // `prompt=consent` para minimizar este caso, pero si llega a ocurrir
      // no hay forma de recuperar el refresh_token sin pedir consentimiento
      // de nuevo.
      return redirectWithError(
        "Google no devolvio un refresh token. Intenta conectar de nuevo.",
      );
    }

    const { error } = await supabase.from("google_calendar_configs").upsert({
      organization_id: profile.organization_id,
      calendar_id: "primary",
      refresh_token_encrypted: encrypt(tokens.refresh_token),
      access_token_encrypted: tokens.access_token ? encrypt(tokens.access_token) : null,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return redirectWithError("No pudimos guardar la conexion con Google Calendar.");
    }

    return NextResponse.redirect(`${origin}/integraciones?googleConnected=1`);
  } catch {
    return redirectWithError("Fallo el intercambio de tokens con Google.");
  }
}
