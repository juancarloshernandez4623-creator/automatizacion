-- organizations: cuenta del negocio (clinica dental, u otro tipo de negocio).
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/Mexico_City',
  created_at timestamptz not null default now()
);

comment on table public.organizations is
  'Cuenta raiz de un negocio (tenant). Todas las demas tablas de negocio cuelgan de organization_id.';
