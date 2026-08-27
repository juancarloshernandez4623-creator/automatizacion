import { cache } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "@/lib/supabase/auth-check";
import { Sidebar } from "@/components/layout/sidebar";

// Next.js llama a `generateMetadata()` y a este layout por separado dentro
// de la misma request -- envolver la consulta en `cache()` evita pegarle
// dos veces a Supabase, y garantiza que el sidebar y el titulo de la
// pestana SIEMPRE muestren exactamente el mismo nombre de organizacion
// (una sola fuente de verdad, nunca pueden desincronizarse).
//
// Este layout corre en CADA navegacion dentro de (app) (dashboard, citas,
// conversaciones, personalizacion, integraciones). Antes, cualquier fallo
// de `getUser()` -- incluida una respuesta lenta de Supabase durante una
// incidencia de su plataforma -- se trataba igual que "no hay sesion" y
// redirigia a /login: eso es exactamente lo que producia "me logueo pero
// las pestanas no funcionan y me echa otra vez". `checkAuth()` distingue
// ese caso (lanza `AuthCheckFailedError`, que sube sin capturar hasta
// `app/error.tsx` y ofrece "Intentar de nuevo") de una sesion realmente
// inexistente (sigue redirigiendo a /login, sin cambios).
const getAppContext = cache(async () => {
  const supabase = await createClient();

  const authResult = await checkAuth(supabase);
  if (authResult.status === "unauthenticated") {
    redirect("/login");
  }
  const user = authResult.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id, organizations(name)")
    .eq("id", user.id)
    .single();

  // No deberia pasar (el trigger private.handle_new_user() siempre crea
  // organization+profile en el mismo INSERT de auth.users), pero si el
  // profile no tiene organizacion todavia, no hay nada util que mostrar.
  if (!profile?.organization_id) {
    redirect("/login?error=" + encodeURIComponent("Tu cuenta aun no tiene un negocio asociado."));
  }

  const organizationName =
    (profile.organizations as { name: string } | null)?.name ?? "Tu negocio";

  return {
    organizationName,
    userLabel: profile.full_name || user.email || "",
  };
});

// Titulo de pestana dinamico: el nombre del negocio del cliente manda (es
// lo que quiere ver el, no el nuestro), "Recepta" queda como sufijo salvo
// que una pagina concreta ponga su propio titulo (ej. "Citas"), en cuyo
// caso pasa a "Citas · {nombre del negocio}".
export async function generateMetadata(): Promise<Metadata> {
  const { organizationName } = await getAppContext();
  return {
    title: {
      template: `%s · ${organizationName}`,
      default: `${organizationName} · Recepta`,
    },
  };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationName, userLabel } = await getAppContext();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar organizationName={organizationName} userLabel={userLabel} />
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
