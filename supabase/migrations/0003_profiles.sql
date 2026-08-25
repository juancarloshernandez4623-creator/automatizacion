-- profiles: extiende auth.users, vincula al usuario con su organization.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_organization_id_idx
  on public.profiles (organization_id);

comment on table public.profiles is
  'Perfil de usuario autenticado, 1:1 con auth.users, vinculado a una organization.';
