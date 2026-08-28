-- Seed minimo para desarrollo local (`supabase db reset` lo corre despues de
-- las migraciones). Crea una organizacion de demo con datos de ejemplo para
-- poder ver /citas y el dashboard con contenido sin tener que agendar nada
-- manualmente a mano.
--
-- IMPORTANTE: este seed NO crea un usuario de auth.users (crear un usuario
-- de Supabase Auth completo a mano requiere columnas internas fragiles entre
-- versiones). No hay /signup: para probar la app como usuario logueado, da
-- de alta un cliente de prueba desde /admin/invites (necesita
-- PLATFORM_ADMIN_EMAIL seteada) e inicia sesion en /login con el codigo que
-- te da -- el trigger private.handle_new_user() (migracion 0012) crea la
-- organizacion + agent_configs por defecto automaticamente. Este seed es
-- solo para tener una organizacion "de sobra" con datos de ejemplo,
-- consultable via el service_role client (ej. en tests o scripts).

insert into public.organizations (id, name, slug, timezone)
values (
  '00000000-0000-0000-0000-000000000001',
  'Clínica Dental Demo',
  'clinica-dental-demo',
  'America/Mexico_City'
)
on conflict (id) do nothing;

insert into public.agent_configs (
  organization_id, system_prompt, tone, business_info, services, business_hours, handoff_message
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Eres el asistente virtual de Clínica Dental Demo. Saluda con calidez, entiende el motivo de contacto del cliente y ayudalo a agendar una cita si lo necesita. Se breve y claro en tus mensajes de WhatsApp.',
  'profesional y cálido',
  '{"name":"Clínica Dental Demo","address":"Av. Reforma 123, CDMX","phone":"+525512345678","description":"Clínica dental de puertas abiertas desde 2015.","faq":"Aceptamos la mayoría de los seguros dentales. Cancelaciones con 24h de anticipación sin costo."}'::jsonb,
  '[{"name":"limpieza","duration_minutes":30,"description":"Limpieza dental de rutina"},{"name":"empaste","duration_minutes":45,"description":"Empaste dental"},{"name":"blanqueamiento","duration_minutes":60,"description":"Blanqueamiento dental"}]'::jsonb,
  '{"mon":[{"start":"09:00","end":"18:00"}],"tue":[{"start":"09:00","end":"18:00"}],"wed":[{"start":"09:00","end":"18:00"}],"thu":[{"start":"09:00","end":"18:00"}],"fri":[{"start":"09:00","end":"18:00"}],"sat":[{"start":"09:00","end":"13:00"}],"sun":[]}'::jsonb,
  'Te paso con un humano en un momento.'
)
on conflict (organization_id) do nothing;

insert into public.contacts (id, organization_id, wa_phone, full_name, is_new_patient)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '+5215500000001', 'Ana García', true),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '+5215500000002', 'Luis Hernández', false)
on conflict (id) do nothing;

insert into public.conversations (id, organization_id, contact_id, bot_active, last_message_at)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', true, now()),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', false, now() - interval '2 hours')
on conflict (id) do nothing;

insert into public.messages (id, conversation_id, organization_id, wa_message_id, direction, sender, content)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'seed-msg-1', 'inbound', 'contact', 'Hola, quiero agendar una limpieza'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'seed-msg-2', 'outbound', 'bot', '¡Hola Ana! Con gusto. ¿Qué día te queda mejor la próxima semana?')
on conflict (id) do nothing;

insert into public.appointments (
  id, organization_id, contact_id, service, starts_at, ends_at, status, is_new_patient, full_name, phone, notes
)
values
  (
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000101',
    'limpieza',
    (date_trunc('day', now()) + interval '1 day' + interval '10 hours'),
    (date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes'),
    'confirmed',
    true,
    'Ana García',
    '+5215500000001',
    'Primera visita, referida por Luis.'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000102',
    'empaste',
    (date_trunc('day', now()) + interval '3 days' + interval '16 hours'),
    (date_trunc('day', now()) + interval '3 days' + interval '16 hours 45 minutes'),
    'confirmed',
    false,
    'Luis Hernández',
    '+5215500000002',
    null
  )
on conflict (id) do nothing;
