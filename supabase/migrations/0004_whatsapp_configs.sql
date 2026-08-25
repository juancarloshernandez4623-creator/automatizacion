-- whatsapp_configs: credenciales de WhatsApp Cloud API por organizacion.
--
-- phone_number_id y verify_token son UNIQUE a proposito: son la clave que
-- usa el webhook (/app/api/webhooks/whatsapp/route.ts) para resolver a que
-- organizacion pertenece un evento entrante, ya que un solo webhook URL de
-- Meta puede recibir trafico de multiples numeros/organizaciones. Ver el
-- algoritmo documentado en el plan de implementacion.
create table if not exists public.whatsapp_configs (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  phone_number_id text not null,
  waba_id text not null,
  access_token_encrypted text not null,
  verify_token text not null,
  app_secret_encrypted text not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists whatsapp_configs_phone_number_id_key
  on public.whatsapp_configs (phone_number_id);

create unique index if not exists whatsapp_configs_verify_token_key
  on public.whatsapp_configs (verify_token);

comment on table public.whatsapp_configs is
  'Credenciales de WhatsApp Cloud API por organizacion. Todos los secretos (access_token, app_secret) se guardan cifrados con AES-256-GCM (ver lib/crypto.ts) antes de insertarse.';
comment on column public.whatsapp_configs.phone_number_id is
  'Phone Number ID de Meta. Unico globalmente: es la clave para resolver la organizacion de un webhook POST entrante.';
comment on column public.whatsapp_configs.verify_token is
  'Token elegido por el negocio al suscribir el webhook en Meta. Unico globalmente: es la clave para resolver la organizacion durante el handshake GET de verificacion.';
