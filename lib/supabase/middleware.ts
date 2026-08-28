import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

// No hay /signup: nadie se registra solo, solo /login (con codigo de acceso
// o, para el administrador, correo+contraseña).
const PUBLIC_PATHS = ["/login", "/callback", "/"];

/** Si Supabase Auth no responde en este tiempo, se trata como "no se pudo
 * verificar sesion" en vez de dejar la peticion colgada. Sin esto, una
 * incidencia de Supabase (lento o caido) tumba TODO el sitio con un
 * MIDDLEWARE_INVOCATION_TIMEOUT de Vercel -- incluida la pagina publica de
 * login, que ni siquiera necesita sesion para mostrarse.
 *
 * Subido de 4000 a 8000ms (28 ago 2026): incidencia activa de Supabase
 * ("Increased response times for requests" / API Gateway degradado, ver
 * status.supabase.com) causando que peticiones que normalmente tardan
 * <1s tarden varios segundos -- con el margen anterior, eso se
 * interpretaba como timeout y forzaba un cierre de sesion de mas.
 * Revertir a un valor mas bajo cuando Supabase marque esas incidencias
 * como resueltas (siguen "Identified" a fecha de este cambio). */
const AUTH_CHECK_TIMEOUT_MS = 8000;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/")),
  );
}

/**
 * Refresca la sesion de Supabase Auth en cada request y redirige a /login
 * si el usuario intenta acceder a una ruta protegida (grupo `(app)`) sin
 * sesion valida. Llamado desde el `middleware.ts` de la raiz del proyecto.
 *
 * Patron oficial de @supabase/ssr para Next.js App Router: el cliente de
 * middleware necesita leer/escribir cookies tanto en `request` (para que el
 * resto del pipeline de este mismo request vea la sesion refrescada) como en
 * `response` (para que el navegador reciba las cookies actualizadas).
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Las rutas /api/* nunca dependen de esta capa para autenticarse: el
  // webhook de WhatsApp se autentica por firma HMAC (no por sesion de
  // usuario), y el resto de rutas API hacen su propio chequeo de sesion via
  // requireCurrentOrg() dentro de cada handler. Sacarlas de aqui evita que
  // una caida o lentitud de Supabase Auth (ej. una incidencia de su propia
  // plataforma) bloquee tambien la entrega de mensajes de WhatsApp, que no
  // tiene nada que ver con la sesion de nadie.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: request.headers } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANTE: no quitar esta llamada. `getUser()` revalida el token contra
  // Supabase Auth (a diferencia de `getSession()`, que solo lee la cookie
  // local) y es lo que efectivamente refresca la sesion cuando expira.
  //
  // Se envuelve con un timeout (`Promise.race`) para que una respuesta lenta
  // o colgada de Supabase nunca deje esta funcion esperando indefinidamente
  // -- eso es justo lo que produce el MIDDLEWARE_INVOCATION_TIMEOUT de
  // Vercel. Si el timeout salta, `user` queda como si no hubiera sesion: en
  // una ruta publica no pasa nada (se sirve igual), y en una protegida se
  // redirige a /login -- un falso "no autenticado" ocasional durante una
  // incidencia real de Supabase es un precio aceptable a cambio de que el
  // sitio entero deje de caerse por completo cuando eso ocurre.
  let user: { id: string } | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("supabase_auth_timeout")), AUTH_CHECK_TIMEOUT_MS);
      }),
    ]);
    user = result.data.user;
  } catch {
    user = null;
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
