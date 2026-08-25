-- google_calendar_configs: tokens OAuth2 de Google Calendar por organizacion.
create table if not exists public.google_calendar_configs (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  calendar_id text not null,
  refresh_token_encrypted text not null,
  access_token_encrypted text,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.google_calendar_configs is
  'Tokens OAuth2 de Google Calendar por organizacion. refresh_token y access_token se guardan cifrados (ver lib/crypto.ts).';
