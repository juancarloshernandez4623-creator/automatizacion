-- Códigos de invitación de un solo uso para gatear el registro (/signup).
--
-- El servicio es solo de pago: dejar que cualquiera cree una cuenta gratis
-- con email+contraseña no encaja con el modelo de negocio. Esta tabla
-- soporta un flujo donde SOLO el dueño de la plataforma (ver
-- PLATFORM_ADMIN_EMAIL en .env.example y app/admin/invites/) genera codigos,
-- y /signup exige uno valido y sin usar antes de crear la cuenta.
--
-- Deliberadamente SIN ninguna policy de RLS (mas alla de habilitarla): esta
-- tabla no tiene ningun caso de uso legitimo desde el navegador (ni anon ni
-- authenticated necesitan leerla ni escribirla nunca), asi que se deja
-- bloqueada por completo salvo para el `service_role` (que bypassa RLS), que
-- es el unico cliente que la toca -- tanto desde la Server Action de
-- /signup como desde el panel de admin. Ver seccion "RLS in exposed
-- schemas" de la skill de Supabase: "enable RLS on every table in an
-- exposed schema" incluye este caso de "sin policies a proposito".
create table public.signup_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- Nota libre del dueño para identificar a que cliente se le dio este
  -- codigo (ej. "Clinica Dental Sonrisas - Ana"). Nunca se muestra al
  -- usuario que se registra.
  label text,
  created_at timestamptz not null default now(),
  -- null = no caduca nunca.
  expires_at timestamptz,
  -- Se rellena con el id del usuario que lo consumio, solo para trazabilidad
  -- en el panel de admin (que codigo dio de alta a quien). `on delete set
  -- null` porque si esa cuenta se borra alguna vez, el codigo historico debe
  -- seguir existiendo con este campo simplemente vacio, no desaparecer.
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  -- Permite invalidar un codigo generado por error o ya no vigente, sin
  -- borrar la fila (se conserva el historial).
  revoked_at timestamptz
);

alter table public.signup_invites enable row level security;

comment on table public.signup_invites is
  'Codigos de invitacion de un solo uso para /signup. Sin policies de RLS a proposito: solo el service_role (Server Actions con lib/supabase/admin.ts) debe tocar esta tabla.';
