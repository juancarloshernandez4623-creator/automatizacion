-- contacts: clientes que han escrito por WhatsApp a una organizacion.
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  wa_phone text not null,
  full_name text,
  is_new_patient boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, wa_phone)
);

create index if not exists contacts_organization_id_idx
  on public.contacts (organization_id);

comment on table public.contacts is
  'Contacto de WhatsApp (cliente final) de una organizacion. wa_phone en formato E.164, ej +5218112345678.';
