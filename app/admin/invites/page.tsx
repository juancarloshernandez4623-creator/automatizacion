import { notFound } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteManager, type InviteListItem } from "./invite-manager";

export const metadata = { title: "Códigos de acceso" };

// Forzado explicitamente: `isPlatformAdmin()` hace un short-circuit ANTES
// de leer cookies si `PLATFORM_ADMIN_EMAIL` no esta seteada, asi que Next.js
// no siempre detecta el uso de una API dinamica aqui y podria (en un build
// sin esa variable) "hornear" esta pagina como un 404 estatico para
// siempre, ignorando la sesion real en cada request futura -- pasó
// exactamente eso en el build de verificacion de este cambio. No dejar que
// el comportamiento de esta pagina dependa de ese detalle.
export const dynamic = "force-dynamic";

/**
 * Panel interno para dar de alta clientes: solo tu (el dueño de la
 * plataforma) puedes crear un cliente nuevo aqui -- crea su cuenta entera
 * (organizacion + auth user) de una vez, con un codigo de acceso PERMANENTE
 * como contraseña. No existe ya ningun /signup: nadie se registra solo, ni
 * con correo+contraseña ni de ninguna otra forma -- el codigo que generas
 * aqui es la unica puerta de entrada, y puedes usarlo tu mismo primero para
 * dejar la cuenta configurada antes de pasarsela al cliente.
 *
 * `notFound()` en vez de un redirect a /login: cualquiera que no sea el
 * admin (incluidos tus propios clientes, que SI tienen sesion valida en su
 * propia organizacion) ve un 404 normal, como si la ruta no existiera. No
 * es la unica capa de seguridad -- `access_codes` no tiene ninguna policy
 * de RLS y solo se toca con el service role -- pero evita ademas que nadie
 * descubra que esta pagina existe.
 */
export default async function AdminInvitesPage() {
  if (!(await isPlatformAdmin())) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: invites } = await admin
    .from("access_codes")
    .select("id, code, label, created_at, expires_at, user_id, revoked_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Códigos de acceso</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Da de alta a un cliente: crea su cuenta y su código de acceso permanente en el
          mismo paso. Puedes iniciar sesión tú primero con ese código para dejarlo todo
          configurado antes de entregárselo.
        </p>
      </div>

      <InviteManager initialInvites={(invites ?? []) as InviteListItem[]} />
    </main>
  );
}
