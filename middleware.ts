import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todas las rutas excepto assets estaticos, archivos de imagen,
     * y las rutas de metadata de Next.js (icon/apple-icon -- generadas por
     * `app/icon.tsx` sin extension en la URL, por eso no las cubre el patron
     * de arriba), para no gastar una llamada a Supabase Auth en cada uno.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
