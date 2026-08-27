import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    {
      /*
       * Corre en todas las rutas excepto assets estaticos, archivos de
       * imagen, y las rutas de metadata de Next.js (icon/apple-icon --
       * generadas por `app/icon.tsx` sin extension en la URL, por eso no las
       * cubre el patron de arriba), para no gastar una llamada a Supabase
       * Auth en cada uno.
       */
      source:
        "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      /*
       * CRITICO: excluye las peticiones de prefetch de <Link> (App Router
       * las precarga solas en cuanto el enlace entra en el viewport, antes
       * de cualquier clic). Next.js las marca con la cabecera
       * `next-router-prefetch` (o `purpose: prefetch` en clientes viejos).
       *
       * Sin esto, cada hover/aparicion en pantalla de un enlace del sidebar
       * dispara aqui otra llamada a `getUser()`, que puede rotar el refresh
       * token de Supabase. Si esa rotacion de una peticion de prefetch
       * "invisible" choca con la rotacion de la navegacion real que el
       * usuario SI hizo, Supabase detecta un refresh token reutilizado y
       * revoca toda la sesion -- esto es EXACTAMENTE lo que producia "entro
       * bien, pero en cuanto pulso otra pestana me manda a /login otra vez":
       * no era Supabase caido ni una sesion realmente invalida, era esta
       * carrera creada por nuestro propio prefetch.
       *
       * Referencia: https://nextjs.org/docs/app/api-reference/file-conventions/proxy#negative-matching
       */
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
