import { NextResponse } from "next/server";
import { requireCurrentOrg, UnauthorizedError } from "@/lib/auth/current-org";
import { AuthCheckFailedError } from "@/lib/supabase/auth-check";
import { buildGoogleAuthUrl } from "@/lib/google/oauth";

export const runtime = "nodejs";

/**
 * Punto de entrada del boton "Conectar con Google" en /integraciones.
 * Construye la URL de autorizacion de Google (necesita GOOGLE_CLIENT_SECRET,
 * por eso vive en el servidor y no se genera desde el Client Component) y
 * redirige al usuario a la pantalla de consentimiento de Google.
 */
export async function GET() {
  try {
    const { organizationId } = await requireCurrentOrg();
    const url = buildGoogleAuthUrl(organizationId);
    return NextResponse.redirect(url);
  } catch (err) {
    // `AuthCheckFailedError` (Supabase Auth no respondio a tiempo) es un
    // caso distinto de "no autenticado": no es culpa de Google, y decirle
    // eso al usuario le manda a resolver el problema equivocado.
    const message =
      err instanceof AuthCheckFailedError
        ? err.message
        : err instanceof UnauthorizedError
          ? err.message
          : "No pudimos iniciar la conexion con Google.";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integraciones?googleError=${encodeURIComponent(message)}`,
    );
  }
}
