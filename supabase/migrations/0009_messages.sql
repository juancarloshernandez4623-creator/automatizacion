-- messages: cada mensaje individual, entrante o saliente, de una conversacion.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  wa_message_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender text not null check (sender in ('contact', 'bot', 'human')),
  content text,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (wa_message_id)
);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_organization_id_idx
  on public.messages (organization_id);

comment on column public.messages.wa_message_id is
  'ID del mensaje segun Meta (message.id). Unico: garantiza idempotencia cuando Meta reintenta la entrega del mismo webhook. NULL permitido para mensajes que no vienen de un evento de Meta (edge case), Postgres no aplica unicidad entre multiples NULLs.';
