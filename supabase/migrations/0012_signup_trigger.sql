-- Al darse de alta un usuario (auth.users), se crea automaticamente su
-- organizacion y su profile (role='owner'), sin importar por que via se dio
-- de alta (password, magic link, admin API futuro).
--
-- La app pasa `organization_name` y `full_name` como user metadata en la
-- llamada a supabase.auth.signUp({ options: { data: {...} } }), que Postgres
-- recibe en NEW.raw_user_meta_data. Si faltan (ej. alta fuera del flujo de
-- signup normal), se usan valores por defecto derivados del email.
--
-- SECURITY DEFINER es necesario: el trigger corre en el contexto de la
-- transaccion de auth.users (sin sesion `authenticated` todavia) y debe
-- poder escribir en organizations/profiles a pesar de RLS. Mitigaciones:
--   - Vive en el schema `private` (no expuesto via PostgREST).
--   - No acepta ningun id proporcionado por el caller: todo sale de NEW.id.
--   - search_path fijo a '' para evitar search_path injection.
--   - No se otorga EXECUTE a anon/authenticated (solo se invoca via trigger).
create schema if not exists private;

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

  -- slugify simple: minusculas, no alfanumerico -> '-', recorta guiones.
  v_base_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  if v_base_slug = '' then
    v_base_slug := 'org';
  end if;
  -- Sufijo de 8 caracteres del uuid del propio usuario: garantiza unicidad
  -- del slug sin necesitar un loop de reintentos.
  v_slug := v_base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug)
  values (v_org_name, v_slug)
  returning id into v_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (new.id, v_org_id, v_full_name, 'owner');

  -- Fila de agent_configs con el prompt/servicios/horarios por defecto para
  -- que /personalizacion tenga algo editable desde el primer login (los
  -- mismos valores viven en web/lib/agent/default-templates.ts, mantener en
  -- sync si se cambian).
  insert into public.agent_configs (
    organization_id, system_prompt, tone, business_info, services, business_hours, handoff_message
  )
  values (
    v_org_id,
    'Eres el asistente virtual de ' || v_org_name || '. Saluda con calidez, entiende el motivo de contacto del cliente y ayudalo a agendar una cita si lo necesita. Se breve y claro en tus mensajes de WhatsApp.',
    'profesional y cálido',
    jsonb_build_object('name', v_org_name, 'address', '', 'phone', '', 'description', '', 'faq', ''),
    '[{"name":"limpieza","duration_minutes":30,"description":"Limpieza dental de rutina"},{"name":"empaste","duration_minutes":45,"description":"Empaste dental"},{"name":"blanqueamiento","duration_minutes":60,"description":"Blanqueamiento dental"}]'::jsonb,
    '{"mon":[{"start":"09:00","end":"18:00"}],"tue":[{"start":"09:00","end":"18:00"}],"wed":[{"start":"09:00","end":"18:00"}],"thu":[{"start":"09:00","end":"18:00"}],"fri":[{"start":"09:00","end":"18:00"}],"sat":[],"sun":[]}'::jsonb,
    'Te paso con un humano en un momento.'
  );

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
