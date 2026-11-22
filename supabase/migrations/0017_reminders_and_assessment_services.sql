-- 0017: recordatorios de cita por WhatsApp + servicios "primera visita / valoracion".
--
-- 1. appointments: marca de recordatorio enviado y de asistencia confirmada
--    por el paciente (al responder al recordatorio).
-- 2. whatsapp_configs: activacion de recordatorios por organizacion y la
--    plantilla de Meta a usar. Fuera de la ventana de 24 h desde el ultimo
--    mensaje del paciente, WhatsApp solo permite escribirle con una
--    plantilla aprobada por Meta -- por eso el nombre/idioma de la plantilla
--    vive junto al resto de credenciales de WhatsApp de la organizacion.
-- 3. private.handle_new_user(): nuevos servicios por defecto con el tipo de
--    reserva (`booking`), mantener en sync con lib/agent/default-templates.ts.
--
-- Todas las columnas nuevas son nullable o con default constante: en
-- Postgres 11+ eso no reescribe la tabla ni la bloquea.

alter table public.appointments
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists attendance_confirmed_at timestamptz;

comment on column public.appointments.reminder_sent_at is
  'Cuando se envio el recordatorio por WhatsApp (null = no enviado). Ver app/api/cron/reminders.';
comment on column public.appointments.attendance_confirmed_at is
  'Cuando el paciente confirmo su asistencia respondiendo al recordatorio (null = sin confirmar).';

-- El cron diario busca citas confirmadas sin recordatorio en un rango de
-- fechas: indice parcial, solo sobre las filas que de verdad consulta.
create index if not exists appointments_pending_reminder_idx
  on public.appointments (starts_at)
  where status = 'confirmed' and reminder_sent_at is null;

alter table public.whatsapp_configs
  add column if not exists reminders_enabled boolean not null default false,
  add column if not exists reminder_template_name text,
  add column if not exists reminder_template_language text not null default 'es';

comment on column public.whatsapp_configs.reminder_template_name is
  'Nombre de la plantilla de Meta (categoria Utilidad) para el recordatorio. Cuerpo esperado con 4 variables: {{1}} nombre, {{2}} negocio, {{3}} fecha, {{4}} hora.';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_name text;
  v_full_name text;
  v_base_slug text;
  v_slug text;
  v_org_id uuid;
begin
  v_org_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''),
    split_part(new.email, '@', 1) || ' Workspace'
  );
  v_full_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');

  v_base_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  if v_base_slug = '' then
    v_base_slug := 'org';
  end if;
  v_slug := v_base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug)
  values (v_org_name, v_slug)
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (new.id, v_org_id, v_full_name, 'owner');

  -- Mismos valores que web/lib/agent/default-templates.ts (mantener en sync).
  insert into public.agent_configs (
    organization_id, system_prompt, tone, business_info, services, business_hours, handoff_message
  )
  values (
    v_org_id,
    'Eres el asistente virtual de ' || v_org_name || '. Saluda con calidez, entiende el motivo de contacto del cliente y ayudalo a agendar una cita si lo necesita. Se breve y claro en tus mensajes de WhatsApp.',
    'profesional y cálido',
    jsonb_build_object('name', v_org_name, 'address', '', 'phone', '', 'description', '', 'faq', ''),
    '[{"name":"primera visita / valoración","duration_minutes":30,"description":"Exploración y diagnóstico para pacientes nuevos o con dolor/molestias","booking":"assessment"},{"name":"limpieza","duration_minutes":30,"description":"Limpieza dental de rutina","booking":"direct"},{"name":"empaste","duration_minutes":45,"description":"Empaste dental","booking":"after_assessment"},{"name":"blanqueamiento","duration_minutes":60,"description":"Blanqueamiento dental","booking":"after_assessment"}]'::jsonb,
    '{"mon":[{"start":"09:00","end":"18:00"}],"tue":[{"start":"09:00","end":"18:00"}],"wed":[{"start":"09:00","end":"18:00"}],"thu":[{"start":"09:00","end":"18:00"}],"fri":[{"start":"09:00","end":"18:00"}],"sat":[],"sun":[]}'::jsonb,
    'Te paso con un humano en un momento.'
  );

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;
