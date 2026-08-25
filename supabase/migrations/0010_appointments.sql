-- appointments: citas agendadas por el agente (o manualmente).
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  service text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  google_event_id text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  is_new_patient boolean,
  full_name text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_ends_after_starts check (ends_at > starts_at)
);

create index if not exists appointments_organization_id_starts_at_idx
  on public.appointments (organization_id, starts_at);

create index if not exists appointments_contact_id_idx
  on public.appointments (contact_id);

-- Evita citas duplicadas para el mismo contacto en el mismo horario exacto
-- (la tool book_appointment tambien chequea esto antes de insertar, pero un
-- indice unico parcial es la garantia real a nivel de base de datos contra
-- condiciones de carrera).
create unique index if not exists appointments_contact_slot_unique_active
  on public.appointments (contact_id, starts_at)
  where (status = 'confirmed');

comment on table public.appointments is
  'Citas agendadas. google_event_id enlaza con el evento correspondiente en Google Calendar para mantener ambos sincronizados.';
