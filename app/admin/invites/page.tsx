import { notFound } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteManager, type InviteListItem } from "./invite-manager";

export const metadata = { title: "Códigos de invitación" };

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
 * plataforma) puedes generar codigos de invitacion, que /signup exige antes
 * de dejar crear una cuenta -- el servicio es de pago, asi que el registro
 * abierto con solo email+contraseña no tiene sentido.
 *
 * `notFound()` en vez de un redirect a /login: cualquiera que no sea el
 * admin (incluidos tus propios clientes, que SI tienen sesion valida en su
 * propia organizacion) ve un 404 normal, como si la ruta no existiera. No
 * es la unica capa de seguridad -- `signup_invites` no tiene ninguna policy
 * de RLS y solo se toca con el service role -- pero evita ademas que nadie
 * descubra que esta pagina existe.
 */
export default async function AdminInvitesPage() {
  if (!(await isPlatformAdmin())) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: invites } = await admin
    .from("signup_invites")
    .select("id, code, label, created_at, expires_at, used_by, used_at, revoked_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Códigos de invitación</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Genera un código y compártelo con el cliente (WhatsApp, email...). Cada código
          solo sirve para crear una cuenta una vez.
        </p>
      </div>

      <InviteManager initialInvites={(invites ?? []) as InviteListItem[]} />
    </main>
  );
}
