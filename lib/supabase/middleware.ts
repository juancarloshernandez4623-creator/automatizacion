import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

const PUBLIC_PATHS = ["/login", "/signup", "/callback", "/api", "/"];

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
