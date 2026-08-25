import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Cliente de Supabase para Server Components y Server Actions. Usa la
 * ANON key (respeta RLS) y lee/escribe la sesion via cookies HTTP-only.
 *
 * Debe crearse UNA vez por request (no reutilizar entre requests): se llama
 * `await createClient()` al inicio de cada Server Component / Server Action
 * que necesite datos de Supabase.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` puede llamarse desde un Server Component (no una
            // Server Action / Route Handler); en ese caso `cookies().set`
            // lanza porque los Server Components no pueden escribir
            // cookies. Es seguro ignorarlo: `middleware.ts` ya se encarga
            // de refrescar la sesion en cada request.
          }
        },
      },
    },
  );
}
