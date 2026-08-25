-- conversations: hilo de conversacion por contacto.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  bot_active boolean not null default true,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists conversations_organization_id_last_message_at_idx
  on public.conversations (organization_id, last_message_at desc);

create index if not exists conversations_contact_id_idx
  on public.conversations (contact_id);

comment on column public.conversations.bot_active is
  'Si es false, el agente de IA no responde en este hilo (el dueno tomo el control manualmente). Lo desactiva request_human_handoff o el toggle del dashboard.';
