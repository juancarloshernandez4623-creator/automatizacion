-- 0018: tipo de negocio por organizacion (clinica dental / centro estetico).
--
-- El agente se comporta distinto segun el tipo (ver
-- lib/agent/build-system-prompt.ts): las reglas de las clinicas dentales no
-- cambian, y los centros esteticos tienen las suyas (valoracion medica solo
-- para tratamientos medico-esteticos, clientes que repiten, precios...).
-- Todas las organizaciones existentes quedan como 'dental' por el default,
-- asi que su comportamiento es exactamente el de antes.
--
-- El trigger de alta lee `business_type` de los metadatos del usuario (lo
-- pasa /admin/invites) y crea los servicios por defecto de ese sector.
-- Mantener los servicios en sync con lib/agent/default-templates.ts.

alter table public.organizations
  add column if not exists business_type text not null default 'dental';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_business_type_check'
  ) then
    alter table public.organizations
      add constraint organizations_business_type_check
      check (business_type in ('dental', 'aesthetic'));
  end if;
end $$;

comment on column public.organizations.business_type is
  'Sector del negocio: dental (clinica dental) o aesthetic (clinica o centro estetico). Cambia los servicios por defecto y las reglas del agente.';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_name text;
  v_full_name text;
  v_type text;
  v_services jsonb;
  v_base_slug text;
  v_slug text;
  v_org_id uuid;
begin
  v_org_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''),
    split_part(new.email, '@', 1) || ' Workspace'
  );
  v_full_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  v_type := coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_type'), ''), 'dental');
  if v_type not in ('dental', 'aesthetic') then
    v_type := 'dental';
  end if;

  v_base_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  if v_base_slug = '' then
    v_base_slug := 'org';
  end if;
  v_slug := v_base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug, business_type)
  values (v_org_name, v_slug, v_type)
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (new.id, v_org_id, v_full_name, 'owner');

  -- Mismos valores que web/lib/agent/default-templates.ts (mantener en sync).
  if v_type = 'aesthetic' then
    v_services := '[{"name":"primera consulta / valoración","duration_minutes":30,"description":"Consulta con el médico estético para valorar el tratamiento adecuado y descartar contraindicaciones","booking":"assessment"},{"name":"limpieza facial","duration_minutes":60,"description":"Higiene facial profunda","booking":"direct"},{"name":"depilación láser","duration_minutes":30,"description":"Sesión de depilación láser","booking":"direct"},{"name":"tratamiento corporal","duration_minutes":60,"description":"Presoterapia, radiofrecuencia o tratamientos reductores","booking":"direct"},{"name":"toxina botulínica (bótox)","duration_minutes":30,"description":"Arrugas de expresión","booking":"after_assessment"},{"name":"ácido hialurónico (rellenos)","duration_minutes":45,"description":"Labios, surcos y pómulos","booking":"after_assessment"},{"name":"mesoterapia / peeling médico","duration_minutes":45,"description":"Rejuvenecimiento médico de la piel","booking":"after_assessment"}]'::jsonb;
  else
    v_services := '[{"name":"primera visita / valoración","duration_minutes":30,"description":"Exploración y diagnóstico para pacientes nuevos o con dolor/molestias","booking":"assessment"},{"name":"limpieza","duration_minutes":30,"description":"Limpieza dental de rutina","booking":"direct"},{"name":"empaste","duration_minutes":45,"description":"Empaste dental","booking":"after_assessment"},{"name":"blanqueamiento","duration_minutes":60,"description":"Blanqueamiento dental","booking":"after_assessment"}]'::jsonb;
  end if;

  insert into public.agent_configs (
    organization_id, system_prompt, tone, business_info, services, business_hours, handoff_message
  )
  values (
    v_org_id,
    'Eres el asistente virtual de ' || v_org_name || '. Saluda con calidez, entiende el motivo de contacto del cliente y ayudalo a agendar una cita si lo necesita. Se breve y claro en tus mensajes de WhatsApp.',
    'profesional y cálido',
    jsonb_build_object('name', v_org_name, 'address', '', 'phone', '', 'description', '', 'faq', ''),
    v_services,
    '{"mon":[{"start":"09:00","end":"18:00"}],"tue":[{"start":"09:00","end":"18:00"}],"wed":[{"start":"09:00","end":"18:00"}],"thu":[{"start":"09:00","end":"18:00"}],"fri":[{"start":"09:00","end":"18:00"}],"sat":[],"sun":[]}'::jsonb,
    'Te paso con un humano en un momento.'
  );

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;
