-- agent_configs: personalizacion del prompt y datos del negocio para el
-- agente de IA. Una fila por organizacion.
create table if not exists public.agent_configs (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  system_prompt text not null,
  tone text not null default 'profesional y cálido',
  -- business_info: { name, address, phone, description, faq }
  business_info jsonb not null default '{}'::jsonb,
  -- services: [{ name, duration_minutes, description }]
  services jsonb not null default '[]'::jsonb,
  -- business_hours: { mon: [{start,end}], tue: [...], ... } claves = dias en ingles de 3 letras minusculas
  business_hours jsonb not null default '{}'::jsonb,
  handoff_message text not null default 'Te paso con un humano en un momento.',
  updated_at timestamptz not null default now()
);

comment on table public.agent_configs is
  'Configuracion editable del agente de IA por organizacion: prompt, tono, info del negocio, servicios y horarios.';
