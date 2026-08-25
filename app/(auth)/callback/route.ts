import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback del flujo PKCE de Supabase Auth: llega aqui cuando el usuario
 * hace click en el magic link o en el enlace de confirmacion de correo tras
 * el signup. Intercambia el `code` de la URL por una sesion valida.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No pudimos validar tu enlace de acceso.")}`,
  );
}
