-- Row Level Security para todas las tablas de negocio.
--
-- Modelo: cada usuario autenticado pertenece (via profiles.organization_id) a
-- UNA organizacion. Todas las policies filtran por esa organizacion. El
-- webhook de WhatsApp y las Server Actions administrativas usan el
-- service_role_key (lib/supabase/admin.ts), cuyo rol Postgres `service_role`
-- tiene BYPASSRLS por defecto en Supabase, por lo que NO necesita policies
-- propias: siempre puede leer/escribir filtrando manualmente por
-- organization_id resuelto en el codigo de la aplicacion.
--
-- Nota de rendimiento (supabase-postgres-best-practices): auth.uid() se
-- envuelve en (select auth.uid()) para que Postgres lo evalue una sola vez
-- por consulta (initPlan) en vez de una vez por fila.

-- -----------------------------------------------------------------------
-- Helper: organization_id del usuario autenticado actual.
-- SECURITY DEFINER + search_path vacio: evita ataques de search_path
-- injection y permite leer profiles independientemente de sus propias
-- policies (que ya de por si solo exponen la fila propia del usuario, asi
-- que no habria conflicto, pero se hace explicito y a prueba de futuros
-- cambios en la policy de profiles).
-- -----------------------------------------------------------------------
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.profiles
  where id = (select auth.uid())
$$;

revoke execute on function public.current_organization_id() from public, anon;
grant execute on function public.current_organization_id() to authenticated;

-- -----------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy "org: miembros pueden ver su organizacion"
  on public.organizations for select
  to authenticated
  using (id = public.current_organization_id());

create policy "org: solo owner puede actualizar su organizacion"
  on public.organizations for update
  to authenticated
  using (
    id = public.current_organization_id()
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'owner'
    )
  )
  with check (id = public.current_organization_id());

-- INSERT/DELETE de organizations no se exponen via API: la creacion ocurre
-- exclusivamente via el trigger private.handle_new_user() (migracion 0012),
-- que usa SECURITY DEFINER y por tanto no necesita (ni respeta) esta policy.

-- -----------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: usuario ve su propio perfil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: usuario ve perfiles de su misma organizacion"
  on public.profiles for select
  to authenticated
  using (organization_id = public.current_organization_id());

create policy "profiles: usuario actualiza su propio perfil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- INSERT de profiles tampoco se expone: lo hace private.handle_new_user().

-- -----------------------------------------------------------------------
-- whatsapp_configs / google_calendar_configs / agent_configs
-- (una fila por organizacion; cualquier miembro puede ver y editar en esta
-- v1 -- no hay distincion granular owner/staff todavia, ver plan)
-- -----------------------------------------------------------------------
alter table public.whatsapp_configs enable row level security;

create policy "whatsapp_configs: miembros de la organizacion"
  on public.whatsapp_configs for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

alter table public.google_calendar_configs enable row level security;

create policy "google_calendar_configs: miembros de la organizacion"
  on public.google_calendar_configs for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

alter table public.agent_configs enable row level security;

create policy "agent_configs: miembros de la organizacion"
  on public.agent_configs for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

-- -----------------------------------------------------------------------
-- contacts / conversations / messages / appointments
-- -----------------------------------------------------------------------
alter table public.contacts enable row level security;

create policy "contacts: miembros de la organizacion"
  on public.contacts for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

alter table public.conversations enable row level security;

create policy "conversations: miembros de la organizacion"
  on public.conversations for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

alter table public.messages enable row level security;

create policy "messages: miembros de la organizacion"
  on public.messages for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

alter table public.appointments enable row level security;

create policy "appointments: miembros de la organizacion"
  on public.appointments for all
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());
