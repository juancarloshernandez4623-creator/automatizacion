import { google } from "googleapis";

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

/**
 * URL de autorizacion de Google OAuth2 para conectar Google Calendar. Se usa
 * `access_type: 'offline'` + `prompt: 'consent'` para garantizar que Google
 * siempre entregue un `refresh_token` (solo lo entrega en el primer
 * consentimiento a menos que se fuerce con `prompt=consent`).
 *
 * `state` lleva el `organization_id` para que el callback sepa a que
 * organizacion asociar los tokens sin depender de la sesion (aunque tambien
 * se valida la sesion en el callback, ver route.ts).
 */
export function buildGoogleAuthUrl(state: string): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GOOGLE_CALENDAR_SCOPE],
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * Construye un cliente OAuth2 ya autenticado con un refresh_token conocido,
 * listo para pasarlo a `google.calendar({ version: 'v3', auth: client })`.
 * googleapis refresca el access_token automaticamente cuando expira.
 */
export function getAuthenticatedClient(refreshToken: string, accessToken?: string | null) {
  const client = getOAuthClient();
  client.setCredentials({
    refresh_token: refreshToken,
    access_token: accessToken ?? undefined,
  });
  return client;
}
